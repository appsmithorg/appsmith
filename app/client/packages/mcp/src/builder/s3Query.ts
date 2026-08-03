import { z } from "zod";
import { storedId } from "./schema.js";

// D4 create_s3_query — a STRUCTURED Amazon S3 file-action builder. The agent never authors a raw request body or raw
// `{{ }}` bindings: it picks an operation (list / read / upload / delete) and supplies a bucket, key, and (for
// upload) body. The compiler emits the S3 plugin's `actionConfiguration.formData` with `smartSubstitution` forced ON,
// so a widget binding is PARAMETERIZED at runtime (the S3 equivalent of a prepared statement) rather than
// string-interpolated — the same safety contract as create_mongo_query. bucket/key literals are charset-gated.

// An S3 bucket name (DNS-style): lowercase letters/digits and dot/dash. No whitespace/quote/brace/`$`/backtick, so
// it embeds safely as a formData value.
const s3Bucket = z
  .string()
  .min(1)
  .max(63)
  .regex(
    /^[a-z0-9][a-z0-9.\-]*$/,
    "bucket must be a DNS-style name (lowercase letters, digits, dot, dash)",
  );

// An S3 object key / prefix: a path token. Charset excludes quote/backtick/brace/`$` so a LITERAL cannot break out of
// its formData string; widget-bound keys are parameterized by smartSubstitution regardless.
const s3Key = z
  .string()
  .min(1)
  .max(1024)
  .regex(
    /^[A-Za-z0-9_./\-]+$/,
    "key must be a path (letters, digits, _ . / -)",
  );

// A binding identifier + property path (same vocabulary as the other query builders).
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");
const propertyPath = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z_][A-Za-z0-9_.]*$/, "must be a dotted identifier path");

// U+2028/U+2029 are included for the same reason schema.ts documents: JSON.stringify does NOT escape them,
// so a value carrying one can break out of the emitted string literal on an older JS engine.
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`|\u2028|\u2029/;
// A value (upload body) — a literal (no binding/template syntax) or a widget reference parameterized at runtime.
const valueRef = z.union([
  z
    .object({
      literal: z
        .string()
        .max(1024 * 1024)
        .refine((v) => !RAW_EXPRESSION.test(v), {
          message: "must not contain binding/template syntax",
        }),
    })
    .strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

type ValueRef = z.infer<typeof valueRef>;

// A key that is either a literal path or a widget reference (parameterized).
const keyRef = z.union([
  z.object({ literal: s3Key }).strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

type KeyRef = z.infer<typeof keyRef>;

export const s3QuerySpecSchema = z
  .object({
    name: bindingIdentifier,
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    operation: z.enum(["list", "read", "upload", "delete"]),
    bucket: s3Bucket,
    // read/upload/delete: the object key. list: optional prefix filter.
    path: keyRef.optional(),
    prefix: s3Key.optional(),
    // upload: the file contents.
    body: valueRef.optional(),
  })
  .strict()
  .superRefine((spec, ctx) => {
    if (spec.operation === "list") {
      if (spec.path !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "list uses 'prefix', not 'path'",
          path: ["path"],
        });
      }
    } else if (spec.path === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${spec.operation} requires a 'path' (object key)`,
        path: ["path"],
      });
    }

    if (spec.operation !== "list" && spec.prefix !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "prefix is only valid on list",
        path: ["prefix"],
      });
    }

    if (spec.operation === "upload" && spec.body === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "upload requires a 'body'",
        path: ["body"],
      });
    }

    if (spec.operation !== "upload" && spec.body !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "body is only valid on upload",
        path: ["body"],
      });
    }
  });

export type S3QuerySpec = z.infer<typeof s3QuerySpecSchema>;

const COMMAND: Record<S3QuerySpec["operation"], string> = {
  list: "LIST",
  read: "READ_FILE",
  upload: "UPLOAD_FILE_FROM_BODY",
  delete: "DELETE_FILE",
};

export interface CompiledS3Query {
  command: string;
  formData: Record<string, unknown>;
  bindingPaths: string[];
}

// Emit a literal verbatim or a widget reference as a bare `{{ Widget.prop }}` (parameterized by smartSubstitution).
function emitRef(ref: ValueRef | KeyRef): { value: string; binding: boolean } {
  if ("literal" in ref) {
    return { value: ref.literal, binding: false };
  }

  return { value: `{{ ${ref.widget}.${ref.property} }}`, binding: true };
}

export function compileS3Query(spec: S3QuerySpec): CompiledS3Query {
  const command = COMMAND[spec.operation];
  const bindingPaths: string[] = [];
  const formData: Record<string, unknown> = {
    command: { data: command },
    bucket: { data: spec.bucket },
    smartSubstitution: { data: true },
  };

  if (spec.path !== undefined) {
    const { binding, value } = emitRef(spec.path);

    formData.path = { data: value };

    if (binding) bindingPaths.push("formData.path.data");
  }

  if (spec.body !== undefined) {
    const { binding, value } = emitRef(spec.body);

    formData.body = { data: value };

    if (binding) bindingPaths.push("formData.body.data");
  }

  if (spec.operation === "list") {
    formData.list = {
      prefix: { data: spec.prefix ?? "" },
      // Return plain object paths (not pre-signed URLs) by default — the common, side-effect-free listing.
      signedUrl: { data: "NO" },
      unSignedUrl: { data: "YES" },
    };
  }

  return { command, formData, bindingPaths };
}

export function buildS3ActionDto(
  spec: S3QuerySpec,
  compiled: CompiledS3Query,
): Record<string, unknown> {
  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    actionConfiguration: {
      formData: compiled.formData,
      ...(compiled.bindingPaths.length > 0
        ? {
            dynamicBindingPathList: compiled.bindingPaths.map((key) => ({
              key,
            })),
          }
        : {}),
    },
  };
}
