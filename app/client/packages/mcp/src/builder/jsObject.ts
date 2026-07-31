import { z } from "zod";

// U+2028/U+2029 are included for the same reason schema.ts documents: JSON.stringify does NOT escape them,
// so a value carrying one can break out of the emitted string literal on an older JS engine.
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`|\u2028|\u2029/;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const REVISION = /^[a-f0-9]{64}$/;

const identifier = z
  .string()
  .min(1)
  .max(128)
  .regex(IDENTIFIER, "must be a plain identifier");
const entityId = z
  .string()
  .min(1)
  .max(128)
  .refine(
    (value) => !RAW_EXPRESSION.test(value),
    "must not contain template syntax",
  );
const revision = z.string().regex(REVISION, "must be a SHA-256 revision token");
const collectionName = z
  .string()
  .min(1)
  .max(64)
  .regex(IDENTIFIER, "must be a plain identifier");

// All emitted values are JSON literals. This deliberately excludes expressions, references, template bindings, and
// executable values; the only dynamic operation in the grammar is a compiler-emitted query `.run()` call.
const literal = z.union([
  z
    .string()
    .max(1_000)
    .refine(
      (value) => !RAW_EXPRESSION.test(value),
      "must not contain template syntax",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const constants = z
  .record(identifier, literal)
  .refine(
    (value) => Object.keys(value).length <= 50,
    "must contain at most 50 constants",
  );

const functionSpecSchema = z
  .object({
    name: identifier,
    // A run is a named, stored Appsmith query. The compiler owns both `await` and `.run()`; callers never supply
    // a callee, arguments, property access, or source code.
    run: z
      .array(z.object({ query: identifier }).strict())
      .max(20)
      .optional(),
    // Return values are a literal object only. A caller cannot smuggle expressions, computed fields, or global
    // references through the generated function.
    returns: z.record(identifier, literal).optional(),
  })
  .strict();

const functions = z.array(functionSpecSchema).min(1).max(50);
const definitionFields = {
  constants: constants.optional(),
  functions,
};

const createFields = {
  applicationId: entityId,
  pageId: entityId,
  workspaceId: entityId,
  pluginId: entityId,
  revision,
  name: collectionName,
};

export const createJsObjectSpecSchema = z
  .object({
    ...createFields,
    ...definitionFields,
  })
  .strict()
  .refine(
    ({ functions }) =>
      new Set(functions.map(({ name }) => name)).size === functions.length,
    "function names must be unique",
  );

export const updateJsObjectSpecSchema = z
  .object({
    applicationId: entityId,
    collectionId: entityId,
    revision,
    name: collectionName.optional(),
    constants: constants.optional(),
    functions: z.array(functionSpecSchema).min(1).max(50).optional(),
  })
  .strict()
  .superRefine((spec, context) => {
    if (
      spec.name === undefined &&
      spec.constants === undefined &&
      spec.functions === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "must update a name or declarative JS-object definition",
      });
    }

    if (
      spec.functions &&
      new Set(spec.functions.map(({ name }) => name)).size !==
        spec.functions.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["functions"],
        message: "function names must be unique",
      });
    }

    if (spec.constants !== undefined && spec.functions === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["functions"],
        message: "must provide a complete function definition with constants",
      });
    }
  });

export const deleteJsObjectSpecSchema = z
  .object({
    applicationId: entityId,
    collectionId: entityId,
    revision,
  })
  .strict();

export type CreateJsObjectSpec = z.infer<typeof createJsObjectSpecSchema>;
export type UpdateJsObjectSpec = z.infer<typeof updateJsObjectSpecSchema>;
export type DeleteJsObjectSpec = z.infer<typeof deleteJsObjectSpecSchema>;

export interface ActionCollectionDto extends Record<string, unknown> {
  name?: string;
  pageId?: string;
  workspaceId?: string;
  pluginId?: string;
  pluginType: "JS";
  body?: string;
  variables?: [];
  actions?: [];
}

export interface ActionCollectionMutationRequest {
  applicationId: string;
  revision: string;
  method: "POST" | "PATCH";
  path: string;
  body: Record<string, unknown>;
  destructive: false;
}

export interface DeleteJsObjectRequest {
  applicationId: string;
  collectionId: string;
  revision: string;
  method: "DELETE";
  path: string;
  destructive: true;
  confirmation: {
    operation: "delete_js_object";
    entityKey: string;
  };
}

function renderObject(
  entries: Record<string, z.infer<typeof literal>>,
): string {
  return Object.entries(entries)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ");
}

function renderFunction(spec: z.infer<typeof functionSpecSchema>): string {
  const statements = (spec.run ?? []).map(
    ({ query }) => `await ${query}.run();`,
  );

  if (spec.returns !== undefined) {
    statements.push(`return { ${renderObject(spec.returns)} };`);
  }

  return `${spec.name}: async () => { ${statements.join(" ")} }`;
}

// This is the sole JS emitter. Names have identifier-only validation and values are JSON serialized, so the output
// cannot contain caller-authored syntax. It creates only constants, async query runs, and literal return objects.
export function compileJsObject(
  spec: Pick<CreateJsObjectSpec, "constants" | "functions">,
): string {
  const constantsSource = spec.constants ? renderObject(spec.constants) : "";
  const functionsSource = spec.functions.map(renderFunction).join(", ");
  const source = `export default { ${[constantsSource, functionsSource].filter(Boolean).join(", ")} };`;

  if (RAW_EXPRESSION.test(source)) {
    throw new Error("compiled JS object contains forbidden template syntax");
  }

  return source;
}

export function buildCreateJsObjectRequest(
  spec: CreateJsObjectSpec,
): ActionCollectionMutationRequest {
  const dto: ActionCollectionDto = {
    name: spec.name,
    pageId: spec.pageId,
    workspaceId: spec.workspaceId,
    pluginId: spec.pluginId,
    pluginType: "JS",
    body: compileJsObject(spec),
    variables: [],
    actions: [],
  };

  return {
    applicationId: spec.applicationId,
    revision: spec.revision,
    method: "POST",
    path: "v1/collections/actions",
    body: dto,
    destructive: false,
  };
}

export function buildUpdateJsObjectRequest(
  spec: UpdateJsObjectSpec,
): ActionCollectionMutationRequest {
  const actionCollection: ActionCollectionDto & { id: string } = {
    id: spec.collectionId,
    pluginType: "JS",
  };

  if (spec.name !== undefined) actionCollection.name = spec.name;

  if (spec.functions !== undefined) {
    actionCollection.body = compileJsObject({
      constants: spec.constants,
      functions: spec.functions,
    });
    actionCollection.variables = [];
    actionCollection.actions = [];
  }

  return {
    applicationId: spec.applicationId,
    revision: spec.revision,
    method: "PATCH",
    path: `v1/collections/actions/${spec.collectionId}`,
    body: {
      actionCollection,
      actions: { added: [], updated: [], deleted: [] },
    },
    destructive: false,
  };
}

export function buildDeleteJsObjectRequest(
  spec: DeleteJsObjectSpec,
): DeleteJsObjectRequest {
  return {
    applicationId: spec.applicationId,
    collectionId: spec.collectionId,
    revision: spec.revision,
    method: "DELETE",
    path: `v1/collections/actions/${spec.collectionId}`,
    destructive: true,
    confirmation: {
      operation: "delete_js_object",
      entityKey: `js_object:${spec.collectionId}`,
    },
  };
}
