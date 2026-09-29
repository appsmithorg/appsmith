import { z } from "zod";
import { storedId } from "./schema.js";

// U+2028/U+2029 are included for the same reason schema.ts documents: JSON.stringify does NOT escape them,
// so a value carrying one can break out of the emitted string literal on an older JS engine.
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`|\u2028|\u2029/;

// The ONE identifier grammar for JS-object names and function names. events.ts (`call`) and app.ts (the
// body-shape scan) reuse these exports, so a function that can be created can always be referenced.
export const JS_IDENTIFIER_SOURCE = "[A-Za-z_][A-Za-z0-9_]*";

const IDENTIFIER = new RegExp(`^${JS_IDENTIFIER_SOURCE}$`);
const REVISION = /^[a-f0-9]{64}$/;

const identifier = z
  .string()
  .min(1)
  .max(128)
  .regex(IDENTIFIER, "must be a plain identifier");
// Stored IDs use the shared `storedId` schema — see schema.ts for why the charset is the security property here.
const entityId = storedId;
const revision = z.string().regex(REVISION, "must be a SHA-256 revision token");
const collectionName = z
  .string()
  .min(1)
  .max(64)
  .regex(IDENTIFIER, "must be a plain identifier");

export const jsFunctionName = identifier;
export const jsCollectionName = collectionName;

// The exact text grammar compileJsObject emits: `export default { <member>, ... };` where a member is a JSON-literal
// constant or `name: async () => { await Q.run(); ... return { k: <literal> }; }`. A body that matches was produced by
// this compiler (or is indistinguishable from it: literals and `.run()` calls only). Everything else is editor-
// authored JavaScript, which the closed grammar cannot re-express and which may hold hardcoded secrets — the MCP
// surface therefore never returns its source and never overwrites its code. Bounded input (64 KB) before the regex
// so an oversized body is classed editor-authored without a scan.
const LITERAL_SOURCE = String.raw`(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)`;
const CONSTANT_SOURCE = `${JS_IDENTIFIER_SOURCE}: ${LITERAL_SOURCE}`;
const RETURNS_SOURCE = String.raw`return \{ ?(?:${CONSTANT_SOURCE}(?:, ${CONSTANT_SOURCE})*)? \}; `;
const FUNCTION_SOURCE = String.raw`${JS_IDENTIFIER_SOURCE}: async \(\) => \{ (?:await ${JS_IDENTIFIER_SOURCE}\.run\(\); )*(?:${RETURNS_SOURCE})? ?\}`;
const MEMBER_SOURCE = `(?:${CONSTANT_SOURCE}|${FUNCTION_SOURCE})`;
const COMPILED_JS_BODY = new RegExp(
  String.raw`^export default \{ ?(?:${MEMBER_SOURCE}(?:, ${MEMBER_SOURCE})*)? \};$`,
);
const MAX_CLASSIFIED_BODY_BYTES = 64 * 1024;

export function isCompilerAuthoredJsBody(body: string): boolean {
  return (
    Buffer.byteLength(body, "utf8") <= MAX_CLASSIFIED_BODY_BYTES &&
    COMPILED_JS_BODY.test(body)
  );
}

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

// One JSAction per compiled function — the shape the Appsmith web client sends (JSPaneUtils
// createDummyJSCollectionActions): the server creates a NewAction per entry so the function is listed, runnable
// and settable in the editor. Without these, a collection carries a body that declares functions the editor
// cannot see. `actionConfiguration.body` is the compiler-emitted function source, never caller text.
export interface JsActionDto extends Record<string, unknown> {
  id?: string;
  name: string;
  workspaceId?: string;
  runBehaviour: "MANUAL";
  clientSideExecution: true;
  actionConfiguration: {
    body: string;
    timeoutInMillisecond: 0;
    jsArguments: [];
  };
}

export interface ActionCollectionDto extends Record<string, unknown> {
  name?: string;
  pageId?: string;
  applicationId?: string;
  workspaceId?: string;
  pluginId?: string;
  pluginType: "JS";
  body?: string;
  variables?: [];
  actions?: JsActionDto[];
}

export interface ActionCollectionMutationRequest {
  applicationId: string;
  revision: string;
  method: "POST" | "PATCH";
  path: string;
  body: Record<string, unknown>;
  // PATCH only: the compiled body to write through `PUT /collections/actions/{id}/body` BEFORE the PATCH. The server
  // nulls `body` on the PATCH route ("a different endpoint updates the body"), so an update that only PATCHed never
  // changed the code — the bug behind "update_js_object leaves the functions as they were".
  jsBody?: string;
  destructive: false;
}

// The subset of an existing collection the update builder needs to diff functions by name: each JSAction's id and
// name. Everything else on the collection is ignored.
export interface ExistingJsObject {
  actions?: { id?: unknown; name?: unknown }[];
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

// The function's source without its name — the same text goes into the collection body (as `name: <source>`) and
// into the per-function JSAction's actionConfiguration.body, so the editor's per-function view matches the object.
function renderFunctionSource(
  spec: z.infer<typeof functionSpecSchema>,
): string {
  const statements = (spec.run ?? []).map(
    ({ query }) => `await ${query}.run();`,
  );

  if (spec.returns !== undefined) {
    statements.push(`return { ${renderObject(spec.returns)} };`);
  }

  return `async () => { ${statements.join(" ")} }`;
}

function renderFunction(spec: z.infer<typeof functionSpecSchema>): string {
  return `${spec.name}: ${renderFunctionSource(spec)}`;
}

function toJsActionDto(
  spec: z.infer<typeof functionSpecSchema>,
  workspaceId?: string,
): JsActionDto {
  const source = renderFunctionSource(spec);

  if (RAW_EXPRESSION.test(source)) {
    throw new Error("compiled JS function contains forbidden template syntax");
  }

  return {
    name: spec.name,
    ...(workspaceId !== undefined ? { workspaceId } : {}),
    runBehaviour: "MANUAL",
    clientSideExecution: true,
    actionConfiguration: {
      body: source,
      timeoutInMillisecond: 0,
      jsArguments: [],
    },
  };
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
  // applicationId is REQUIRED by the server (LayoutCollectionServiceCEImpl answers INVALID_PARAMETER / 400 without
  // it, before any other check) — its absence was the "Appsmith API request failed (400)" on every create.
  const dto: ActionCollectionDto = {
    name: spec.name,
    pageId: spec.pageId,
    applicationId: spec.applicationId,
    workspaceId: spec.workspaceId,
    pluginId: spec.pluginId,
    pluginType: "JS",
    body: compileJsObject(spec),
    variables: [],
    actions: spec.functions.map((fn) => toJsActionDto(fn, spec.workspaceId)),
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
  current: ExistingJsObject = {},
): ActionCollectionMutationRequest {
  const actionCollection: ActionCollectionDto & { id: string } = {
    id: spec.collectionId,
    pluginType: "JS",
  };
  const actions: {
    added: JsActionDto[];
    updated: JsActionDto[];
    deleted: { id: string; name: string }[];
  } = { added: [], updated: [], deleted: [] };
  let jsBody: string | undefined;

  if (spec.name !== undefined) actionCollection.name = spec.name;

  if (spec.functions !== undefined) {
    jsBody = compileJsObject({
      constants: spec.constants,
      functions: spec.functions,
    });

    // Diff the new function set against the collection's existing JSActions by name: a matching name is an
    // update (keeps its id and settings), a new name is an add, a name no longer present is a delete. The server
    // creates/updates/deletes one NewAction per entry; the body is written separately (jsBody).
    const existing = new Map<string, string>();

    for (const action of current.actions ?? []) {
      if (typeof action.id === "string" && typeof action.name === "string") {
        existing.set(action.name, action.id);
      }
    }

    const wanted = new Set<string>();

    for (const fn of spec.functions) {
      wanted.add(fn.name);

      const id = existing.get(fn.name);
      // No workspaceId on update: the server fills it from the collection (populateActionFieldsFromCollection).
      const dto = toJsActionDto(fn);

      if (id === undefined) {
        actions.added.push(dto);
      } else {
        actions.updated.push({ ...dto, id });
      }
    }

    for (const [name, id] of existing) {
      if (!wanted.has(name)) actions.deleted.push({ id, name });
    }
  }

  return {
    applicationId: spec.applicationId,
    revision: spec.revision,
    method: "PATCH",
    path: `v1/collections/actions/${spec.collectionId}`,
    body: { actionCollection, actions },
    ...(jsBody !== undefined ? { jsBody } : {}),
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
