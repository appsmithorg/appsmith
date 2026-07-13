import { z } from "zod";

const MAX_BODY_BYTES = 8 * 1024;
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const BINDING_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PROPERTY_PATH = /^[A-Za-z_][A-Za-z0-9_.]*$/;
const FIELD_KEY = /^[A-Za-z][A-Za-z0-9_.-]*$/;
const PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/;
const SAFE_BINDING =
  /^\{\{ [A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \}\}$/;

const actionName = z
  .string()
  .min(1)
  .max(64)
  .regex(BINDING_IDENTIFIER, "must be alphanumeric/underscore");

const identifier = z.string().min(1).max(128);

const literalScalar = z.union([
  z
    .string()
    .max(1000)
    .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const valueRef = z.union([
  z.object({ literal: literalScalar }).strict(),
  z
    .object({
      widget: actionName,
      property: z
        .string()
        .min(1)
        .max(128)
        .regex(PROPERTY_PATH, "must be a dotted identifier path"),
    })
    .strict(),
]);

const keyValueRef = z
  .object({
    key: z.string().min(1).max(64).regex(FIELD_KEY, "must be a safe key"),
    value: valueRef,
  })
  .strict();

const safePath = z
  .string()
  .min(1)
  .max(512)
  .refine((value) => {
    if (
      !value.startsWith("/") ||
      value.includes("://") ||
      value.includes("//") ||
      value.includes("?") ||
      value.includes("#") ||
      RAW_EXPRESSION.test(value)
    ) {
      return false;
    }

    const segments = value.slice(1).split("/");

    return (
      segments.length > 0 &&
      segments.every(
        (segment) =>
          segment !== "." && segment !== ".." && PATH_SEGMENT.test(segment),
      )
    );
  }, "must be an absolute path made of safe segments");

const header = z
  .union([
    z
      .object({
        key: z.literal("Accept"),
        value: z.enum(["application/json", "text/plain", "*/*"]),
      })
      .strict(),
    z
      .object({
        key: z.literal("Content-Type"),
        value: z.enum([
          "application/json",
          "application/x-www-form-urlencoded",
        ]),
      })
      .strict(),
  ])
  .refine((value) => !RAW_EXPRESSION.test(value.value), "no template syntax");

const body = z
  .discriminatedUnion("type", [
    z
      .object({
        type: z.literal("json"),
        values: z.record(z.string().min(1).max(64).regex(FIELD_KEY), valueRef),
      })
      .strict(),
    z
      .object({
        type: z.literal("form"),
        fields: z.array(keyValueRef).min(1).max(50),
      })
      .strict(),
  ])
  .refine(
    (value) =>
      value.type !== "json" || Object.entries(value.values).length <= 50,
    "must contain at most 50 fields",
  );

export const restApiSpecSchema = z
  .object({
    name: actionName,
    applicationId: identifier,
    pageId: identifier,
    // Stored datasource only: callers cannot submit an inline base URL or config.
    datasourceId: identifier,
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    path: safePath,
    queryParameters: z
      .array(keyValueRef)
      .max(20)
      .refine(
        (values) =>
          new Set(values.map(({ key }) => key)).size === values.length,
        "must not repeat query parameter keys",
      )
      .optional(),
    headers: z
      .array(header)
      .max(2)
      .refine(
        (values) =>
          new Set(values.map(({ key }) => key)).size === values.length,
        "must not repeat header keys",
      )
      .optional(),
    body: body.optional(),
  })
  .strict();

export type RestApiSpec = z.infer<typeof restApiSpecSchema>;
type ValueRef = z.infer<typeof valueRef>;
type RestBody = z.infer<typeof body>;

function emitValue(value: ValueRef): string {
  if ("literal" in value) {
    return JSON.stringify(value.literal);
  }

  const binding = `{{ ${value.widget}.${value.property} }}`;

  if (!SAFE_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  return binding;
}

function emitParameterValue(value: ValueRef): string {
  return "literal" in value
    ? value.literal === null
      ? "null"
      : String(value.literal)
    : emitValue(value);
}

function compileBody(body: RestBody | undefined): {
  body: string;
  bodyFormData: { key: string; value: string }[];
  apiContentType:
    | "none"
    | "application/json"
    | "application/x-www-form-urlencoded";
} {
  if (!body) {
    return { body: "", bodyFormData: [], apiContentType: "none" };
  }

  if (body.type === "form") {
    return {
      body: "",
      bodyFormData: body.fields.map(({ key, value }) => ({
        key,
        value: emitParameterValue(value),
      })),
      apiContentType: "application/x-www-form-urlencoded",
    };
  }

  const entries = Object.entries(body.values).map(
    ([key, value]) => `${JSON.stringify(key)}:${emitValue(value)}`,
  );

  return {
    body: `{${entries.join(",")}}`,
    bodyFormData: [],
    apiContentType: "application/json",
  };
}

function assertBodySafe(body: string): void {
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("compiled REST body exceeds the size limit");
  }

  if (/\$\{|`/.test(body)) {
    throw new Error("compiled REST body contains forbidden template syntax");
  }

  const openings = (body.match(/\{\{/g) ?? []).length;
  const closings = (body.match(/\}\}/g) ?? []).length;
  const bindings = body.match(/\{\{ [^}]* \}\}/g) ?? [];

  if (
    openings !== closings ||
    openings !== bindings.length ||
    !bindings.every((binding) => SAFE_BINDING.test(binding))
  ) {
    throw new Error("compiled REST body contains an unsafe binding");
  }
}

export interface CompiledRestApi {
  path: string;
  queryParameters: { key: string; value: string }[];
  headers: { key: "Accept" | "Content-Type"; value: string }[];
  body: string;
  bodyFormData: { key: string; value: string }[];
  apiContentType:
    | "none"
    | "application/json"
    | "application/x-www-form-urlencoded";
}

// Emits the only dynamic syntax accepted by REST actions. Values supplied by callers are either serialized literals
// or a validated widget reference; raw Appsmith bindings are never passed through.
export function compileRestApi(spec: RestApiSpec): CompiledRestApi {
  if (spec.body && spec.method === "GET") {
    throw new Error("GET requests cannot include a body");
  }

  const compiledBody = compileBody(spec.body);

  assertBodySafe(compiledBody.body);
  compiledBody.bodyFormData.forEach((field) => assertBodySafe(field.value));

  return {
    path: spec.path,
    queryParameters: (spec.queryParameters ?? []).map(({ key, value }) => ({
      key,
      value: emitParameterValue(value),
    })),
    headers: spec.headers ?? [],
    ...compiledBody,
  };
}

// Builds the REST ActionDTO accepted by POST /api/v1/actions. The datasource remains an embedded identifier; its
// configuration, including the base URL and authentication, stays server-side in the stored datasource.
export function buildRestActionDto(
  spec: RestApiSpec,
  compiled: CompiledRestApi,
): Record<string, unknown> {
  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    actionConfiguration: {
      path: compiled.path,
      httpMethod: spec.method,
      httpVersion: "HTTP11",
      encodeParamsToggle: true,
      headers: compiled.headers,
      queryParameters: compiled.queryParameters,
      body: compiled.body,
      bodyFormData: compiled.bodyFormData,
      formData: { apiContentType: compiled.apiContentType },
      pluginSpecifiedTemplates: [{ value: true }],
    },
  };
}
