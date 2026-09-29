import { z } from "zod";
import {
  compileExpr,
  compileSteps,
  type Expr,
  type ExprContext,
  exprSchema,
  identifier,
  JS_IDENTIFIER_SOURCE,
  literalSchema,
  localName,
  memberName,
  PARAMS_MAX,
  RAW_EXPRESSION,
  type Step,
  stepSchema,
  STEPS_MAX,
  stepsProblem,
  validateExpr,
} from "./jsExpr.js";
import { HOST_NAMES, storedId } from "./schema.js";

export { JS_IDENTIFIER_SOURCE } from "./jsExpr.js";

const IDENTIFIER = new RegExp(`^${JS_IDENTIFIER_SOURCE}$`);
const REVISION = /^[a-f0-9]{64}$/;

// Stored IDs use the shared `storedId` schema — see schema.ts for why the charset is the security property here.
const entityId = storedId;
const revision = z.string().regex(REVISION, "must be a SHA-256 revision token");
// The object's name is emitted bare in event bindings (`Name.fn(...)`), so a host global can never be one.
const collectionName = z
  .string()
  .min(1)
  .max(64)
  .regex(IDENTIFIER, "must be a plain identifier")
  .refine(
    (name) => !HOST_NAMES.has(name),
    "is a host global, not a JS object name",
  );

// The ONE identifier grammar for JS-object names and function names. events.ts (`call`) and app.ts (the
// body-shape scan) reuse these exports, so a function that can be created can always be referenced. Function
// names are object-literal keys, so prototype names are refused (memberName); params use the shared jsExpr
// reserved list (localName) so `class` / `eval` can never reach `async function (<param>)`.
export const jsFunctionName = memberName;
export const jsCollectionName = collectionName;

// Constants are JSON literals on the object (`this.<name>` inside functions).
const constants = z
  .record(memberName, literalSchema)
  .refine(
    (value) => Object.keys(value).length <= 50,
    "must contain at most 50 constants",
  );

// A function: optional parameters, an ordered list of statements from the closed jsExpr grammar, and an optional
// return expression. `run` (a fixed list of query calls) and a literal-record `returns` are the original grammar and
// stay accepted so existing agents keep working; they compile to the same text they always did.
const functionSpecSchema = z
  .object({
    name: memberName,
    params: z.array(localName).max(PARAMS_MAX).optional(),
    run: z
      .array(
        z
          .object({
            query: identifier.refine(
              (name) => !HOST_NAMES.has(name),
              "is a host global, not a query name",
            ),
          })
          .strict(),
      )
      .max(20)
      .optional(),
    steps: z.array(stepSchema).max(STEPS_MAX).optional(),
    returns: z
      .union([exprSchema, z.record(memberName, literalSchema)])
      .optional(),
  })
  .strict()
  .refine(
    ({ params }) => new Set(params ?? []).size === (params ?? []).length,
    { path: ["params"], message: "parameter names must be unique" },
  );

export type FunctionSpec = z.infer<typeof functionSpecSchema>;

const functions = z.array(functionSpecSchema).min(1).max(50);

// Everything that describes the object's code: constants + functions. This is what the compiler consumes and what
// it embeds (encoded) in the emitted body so the object can be recognised and read back as a definition.
export const jsObjectDefinitionSchema = z
  .object({ constants: constants.optional(), functions })
  .strict()
  .superRefine((definition, ctx) => {
    if (
      new Set(definition.functions.map(({ name }) => name)).size !==
      definition.functions.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["functions"],
        message: "function names must be unique",
      });
    }

    const constantNames = new Set(Object.keys(definition.constants ?? {}));

    definition.functions.forEach((fn, index) => {
      const problem = functionProblem(fn, constantNames);

      if (problem) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["functions", index],
          message: `${fn.name}: ${problem}`,
        });
      }
    });
  });

export type JsObjectDefinition = z.infer<typeof jsObjectDefinitionSchema>;

function isLegacyReturns(
  returns: FunctionSpec["returns"],
): returns is Record<string, z.infer<typeof literalSchema>> {
  if (
    returns === null ||
    typeof returns !== "object" ||
    Array.isArray(returns)
  ) {
    return false;
  }

  // An Expr node is a single-purpose strict object; a legacy record is any other plain object of literals.
  const keys = Object.keys(returns);
  const exprKeys = [
    "param",
    "var",
    "item",
    "widget",
    "query",
    "constant",
    "store",
    "op",
    "fn",
    "if",
    "object",
    "array",
  ];

  if (keys.some((key) => exprKeys.includes(key))) return false;

  return Object.values(returns).every(
    (value) =>
      value === null || ["string", "number", "boolean"].includes(typeof value),
  );
}

// Scoping/arity/bounds validation for one function; the schema alone cannot see across statements.
function functionProblem(
  fn: FunctionSpec,
  constantNames: Set<string>,
): string | undefined {
  const params = new Set(fn.params ?? []);
  const ctx: ExprContext = {
    params,
    vars: new Set(),
    constants: constantNames,
    allowItem: false,
  };
  const declared = new Set<string>();

  if (fn.steps) {
    const problem = stepsProblem(fn.steps, ctx, 1, { count: 0 }, declared);

    if (problem) return problem;
  }

  if (fn.returns !== undefined && !isLegacyReturns(fn.returns)) {
    return validateExpr(fn.returns as Expr, { ...ctx, vars: declared });
  }

  return undefined;
}

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

function attachDefinitionIssues(
  spec: {
    constants?: JsObjectDefinition["constants"];
    functions?: FunctionSpec[];
  },
  ctx: z.RefinementCtx,
): void {
  if (spec.functions === undefined) return;

  const parsed = jsObjectDefinitionSchema.safeParse({
    constants: spec.constants,
    functions: spec.functions,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) ctx.addIssue(issue);
  }
}

export const createJsObjectSpecSchema = z
  .object({
    ...createFields,
    ...definitionFields,
  })
  .strict()
  .superRefine(attachDefinitionIssues);

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

    if (spec.constants !== undefined && spec.functions === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["functions"],
        message: "must provide a complete function definition with constants",
      });
    }

    attachDefinitionIssues(spec, context);
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
    jsArguments: { name: string; value: "" }[];
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
  entries: Record<string, z.infer<typeof literalSchema>>,
): string {
  return Object.entries(entries)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ");
}

// The function's source without its name — the same text goes into the collection body (as `name: <source>`) and
// into the per-function JSAction's actionConfiguration.body, so the editor's per-function view matches the object.
function renderFunctionSource(spec: FunctionSpec): string {
  const statements = (spec.run ?? []).map(
    ({ query }) => `await ${query}.run();`,
  );

  if (spec.steps) statements.push(...compileSteps(spec.steps as Step[]));

  if (spec.returns !== undefined) {
    statements.push(
      isLegacyReturns(spec.returns)
        ? `return { ${renderObject(spec.returns)} };`
        : `return ${compileExpr(spec.returns as Expr)};`,
    );
  }

  const params = (spec.params ?? []).join(", ");

  // A function EXPRESSION, never an arrow: the eval worker resolves each member from its source and invokes it with
  // `.apply(THIS_CONTEXT, args)` (evaluate.ts), so `this.<constant>` only resolves when `this` is bound at call time.
  // An arrow would freeze `this` at resolution time. This is also the JSAction body shape the web editor sends
  // (`async function () {}` in JSPaneUtils).
  return `async function (${params}) { ${statements.join(" ")} }`;
}

function renderFunction(spec: FunctionSpec): string {
  return `${spec.name}: ${renderFunctionSource(spec)}`;
}

function toJsActionDto(spec: FunctionSpec, workspaceId?: string): JsActionDto {
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
      jsArguments: (spec.params ?? []).map((name) => ({ name, value: "" })),
    },
  };
}

// The code part of the body: everything the object's JavaScript is. Kept separate from the definition marker so
// the classifier can recompile a decoded definition and compare it against exactly this text.
export function compileJsObjectCode(definition: JsObjectDefinition): string {
  const constantsSource = definition.constants
    ? renderObject(definition.constants)
    : "";
  const functionsSource = definition.functions.map(renderFunction).join(", ");
  const source = `export default { ${[constantsSource, functionsSource].filter(Boolean).join(", ")} };`;

  if (RAW_EXPRESSION.test(source)) {
    throw new Error("compiled JS object contains forbidden template syntax");
  }

  return source;
}

// The definition is embedded after the code as a base64 JSON block comment. Base64 cannot contain `*/`, `{{`,
// backticks or line separators, so the marker can neither end the comment early nor become a binding. It lets
// read_js_object hand the definition back (so an agent edits functions structurally instead of guessing at
// source) and lets isCompilerAuthoredJsBody recognise the object EXACTLY: the decoded definition must recompile
// to the code part byte for byte.
//
// The marker is located with lastIndexOf / endsWith — never a regex over the whole body — because a 256 KB body of
// whitespace made the earlier `\s*…$` pattern take ~37 s and read_js_object classifies EVERY collection in the app
// [COUNCIL: APP-16052 M2 security, availability].
//
// The payload carries `v`: the compiler's output text is the recognition contract, so when a template changes,
// bump SPEC_VERSION and add an upgrade path for older markers instead of silently demoting every object.
const SPEC_VERSION = 1;
const MARKER_PREFIX = " /* mcp-spec:";
const MARKER_SUFFIX = " */";
const BASE64 = /^[A-Za-z0-9+/=]+$/;

export function compileJsObject(definition: JsObjectDefinition): string {
  // Embed ONLY the definition fields: a caller may pass a whole create/update spec (ids, revision, name), and the
  // strict definition schema must accept the decoded marker for the object to be recognised as compiler-authored.
  const pure: JsObjectDefinition = {
    ...(definition.constants !== undefined
      ? { constants: definition.constants }
      : {}),
    functions: definition.functions,
  };
  const code = compileJsObjectCode(pure);
  const encoded = Buffer.from(
    JSON.stringify({ v: SPEC_VERSION, ...pure }),
    "utf8",
  ).toString("base64");

  return `${code}${MARKER_PREFIX}${encoded}${MARKER_SUFFIX}`;
}

// Splits a body into its code part and the marker's base64 payload, or undefined when no well-formed marker
// terminates the body. Linear time: no regex touches the code part. The split is NOT a security boundary — an
// editor-authored code part may itself contain " /* mcp-spec:" text; only the byte-equality recompile in
// jsObjectDefinitionFromBody decides whether a body is compiler-authored.
function splitSpecMarker(
  body: string,
): { code: string; encoded: string } | undefined {
  if (!body.endsWith(MARKER_SUFFIX)) return undefined;

  const start = body.lastIndexOf(MARKER_PREFIX);

  if (start < 0) return undefined;

  const encoded = body.slice(
    start + MARKER_PREFIX.length,
    body.length - MARKER_SUFFIX.length,
  );

  return BASE64.test(encoded)
    ? { code: body.slice(0, start), encoded }
    : undefined;
}

// Whether a body ends in a marker at all (well-formed or not). Distinguishes "the compiler never wrote this" from
// "the compiler wrote this and the code part was edited afterwards" for jsObjectView's definitionState.
export function hasSpecMarker(body: string): boolean {
  return (
    Buffer.byteLength(body, "utf8") <= MAX_CLASSIFIED_BODY_BYTES &&
    splitSpecMarker(body) !== undefined
  );
}

// Compiles a create/update spec's definition fields (ids, revision and name are not part of the code). The emitted
// text is produced by jsExpr.ts's templates and this file's member layout; see the RECEIVER and COMPATIBILITY rules
// at the top of jsExpr.ts's compiler section.
export function compileJsObjectFromSpec(
  spec: Pick<CreateJsObjectSpec, "constants" | "functions">,
): string {
  return compileJsObject({
    constants: spec.constants,
    functions: spec.functions,
  });
}

// Legacy shape (objects written before the definition marker existed): `export default { <member>, ... };` where
// a member is a JSON-literal constant or `name: async () => { await Q.run(); ... return { k: <literal> }; }`.
const LITERAL_SOURCE = String.raw`(?:"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)`;
const CONSTANT_SOURCE = `${JS_IDENTIFIER_SOURCE}: ${LITERAL_SOURCE}`;
const RETURNS_SOURCE = String.raw`return \{ ?(?:${CONSTANT_SOURCE}(?:, ${CONSTANT_SOURCE})*)? \}; `;
const FUNCTION_SOURCE = String.raw`${JS_IDENTIFIER_SOURCE}: async \(\) => \{ (?:await ${JS_IDENTIFIER_SOURCE}\.run\(\); )*(?:${RETURNS_SOURCE})? ?\}`;
const MEMBER_SOURCE = `(?:${CONSTANT_SOURCE}|${FUNCTION_SOURCE})`;
const LEGACY_COMPILED_JS_BODY = new RegExp(
  String.raw`^export default \{ ?(?:${MEMBER_SOURCE}(?:, ${MEMBER_SOURCE})*)? \};$`,
);
const MAX_CLASSIFIED_BODY_BYTES = 256 * 1024;
const MAX_LEGACY_CLASSIFIED_BODY_BYTES = 64 * 1024;

// The definition a compiler-authored body carries, or undefined when the body is editor-authored (no marker, an
// undecodable/invalid marker, or a marker whose definition does not recompile to the code part — i.e. someone
// edited the code by hand after the compiler wrote it, which makes it hand-written code again).
export function jsObjectDefinitionFromBody(
  body: string,
): JsObjectDefinition | undefined {
  if (Buffer.byteLength(body, "utf8") > MAX_CLASSIFIED_BODY_BYTES) {
    return undefined;
  }

  const marker = splitSpecMarker(body);

  if (!marker) return undefined;

  let decoded: unknown;

  try {
    decoded = JSON.parse(
      Buffer.from(marker.encoded, "base64").toString("utf8"),
    );
  } catch {
    return undefined;
  }

  if (
    decoded === null ||
    typeof decoded !== "object" ||
    (decoded as { v?: unknown }).v !== SPEC_VERSION
  ) {
    return undefined;
  }

  const definition: Record<string, unknown> = {
    ...(decoded as Record<string, unknown>),
  };

  delete definition.v;
  const parsed = jsObjectDefinitionSchema.safeParse(definition);

  if (!parsed.success) return undefined;

  try {
    return compileJsObjectCode(parsed.data) === marker.code
      ? parsed.data
      : undefined;
  } catch {
    return undefined;
  }
}

export function isCompilerAuthoredJsBody(body: string): boolean {
  if (jsObjectDefinitionFromBody(body) !== undefined) return true;

  // The legacy shape is a nested-quantifier regex; keep it on the cap it was measured at.
  return (
    Buffer.byteLength(body, "utf8") <= MAX_LEGACY_CLASSIFIED_BODY_BYTES &&
    LEGACY_COMPILED_JS_BODY.test(body)
  );
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
    body: compileJsObjectFromSpec(spec),
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
    jsBody = compileJsObjectFromSpec({
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
