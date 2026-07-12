import { z } from "zod";

// M4 create_query — a STRUCTURED query builder (Security ruling "Option B"). The agent never authors raw SQL or raw
// `{{ }}`. The compiler emits the SQL text AND every binding from validated identifiers, and every value is emitted
// as a `{{ }}` bind parameter (prepared statement), never string-concatenated. This bounds SQL injection (values are
// parameterized, identifiers are allow-listed) and preserves the "agents never author raw expressions" invariant.

// SQL identifier: a table/column/schema name. No quotes, semicolons, whitespace, comment tokens, or brace/`$`.
const SQL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const sqlIdentifier = z
  .string()
  .min(1)
  .max(128)
  .regex(SQL_IDENTIFIER, "must be a plain SQL identifier");

// A qualified name is `table` or `schema.table` — each part a plain identifier.
const qualifiedName = z
  .string()
  .min(1)
  .max(257)
  .refine(
    (value) => value.split(".").every((part) => SQL_IDENTIFIER.test(part)),
    "must be table or schema.table (plain identifiers)",
  );

// Binding identifier (query/widget name), same rule the widget-binding vocabulary uses.
const bindingIdentifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");

// A property path on a widget, e.g. `selectedRow.id`. Dotted plain identifiers only.
const propertyPath = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z_][A-Za-z0-9_.]*$/, "must be a dotted identifier path");

// A scalar literal that cannot contain expression/template syntax (mirrors the schema's scalarCell).
const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const literalScalar = z.union([
  z
    .string()
    .max(1000)
    .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  z.number(),
  z.boolean(),
  z.null(),
]);

// The ONLY place dynamic data enters a query: a literal (emitted as a bind param) or a widget reference.
const valueRef = z.union([
  z.object({ literal: literalScalar }).strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

const OPERATORS = {
  eq: "=",
  ne: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "LIKE",
  in: "IN",
} as const;

export const querySpecSchema = z
  .object({
    name: bindingIdentifier,
    // NOTE: no workspaceId — the tool resolves the workspace server-authoritatively from applicationId so a
    // prompt-injected agent cannot bind a datasource from another workspace onto this page (cross-tenant guard).
    applicationId: z.string().min(1).max(128),
    pageId: z.string().min(1).max(128),
    datasourceId: z.string().min(1).max(128),
    operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
    table: qualifiedName,
    columns: z.array(sqlIdentifier).max(100).optional(),
    filters: z
      .array(
        z
          .object({
            column: sqlIdentifier,
            op: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "like", "in"]),
            value: valueRef,
          })
          .strict(),
      )
      .max(20)
      .optional(),
    values: z
      .array(z.object({ column: sqlIdentifier, value: valueRef }).strict())
      .max(100)
      .optional(),
    limit: z.number().int().min(1).max(1000).optional(),
  })
  .strict();

export type QuerySpec = z.infer<typeof querySpecSchema>;
type ValueRef = z.infer<typeof valueRef>;

const MAX_BODY_BYTES = 8 * 1024;

// Emit a value as a `{{ }}` bind parameter. A literal is JSON-encoded (safe: it passed the no-raw-expression gate, so
// it cannot contain braces); a widget reference is a validated identifier path. Either way the braces are
// compiler-authored and the inner content cannot break out.
function emitBinding(value: ValueRef): string {
  const binding =
    "literal" in value
      ? `{{ ${JSON.stringify(value.literal)} }}`
      : `{{ ${value.widget}.${value.property} }}`;

  // Fail-closed at the point of construction, where this is unambiguously a single binding (a body-level scan can be
  // fooled by a `}` inside a string literal). Every emitted binding must be an identifier path or a JSON scalar.
  if (!SAFE_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  return binding;
}

function emitWhere(filters: QuerySpec["filters"]): string {
  if (!filters || filters.length === 0) return "";

  const clauses = filters.map((filter) => {
    const operator = OPERATORS[filter.op];
    const binding = emitBinding(filter.value);

    if (filter.op === "in") return `${filter.column} IN (${binding})`;

    return `${filter.column} ${operator} ${binding}`;
  });

  return ` WHERE ${clauses.join(" AND ")}`;
}

// Compile a structured spec into a parameterized SQL body. Throws on an empty/oversized body or if the emitted body
// somehow contains a brace pair that isn't a compiler-emitted binding (fail-closed defense-in-depth).
export function compileQuery(spec: QuerySpec): string {
  let body: string;

  switch (spec.operation) {
    case "SELECT": {
      const columns =
        spec.columns && spec.columns.length > 0 ? spec.columns.join(", ") : "*";
      const limit = spec.limit !== undefined ? ` LIMIT ${spec.limit}` : "";

      body = `SELECT ${columns} FROM ${spec.table}${emitWhere(spec.filters)}${limit};`;
      break;
    }
    case "INSERT": {
      if (!spec.values || spec.values.length === 0) {
        throw new Error("INSERT requires values");
      }

      const columns = spec.values.map((entry) => entry.column).join(", ");
      const bindings = spec.values
        .map((entry) => emitBinding(entry.value))
        .join(", ");

      body = `INSERT INTO ${spec.table} (${columns}) VALUES (${bindings});`;
      break;
    }
    case "UPDATE": {
      if (!spec.values || spec.values.length === 0) {
        throw new Error("UPDATE requires values");
      }

      const assignments = spec.values
        .map((entry) => `${entry.column} = ${emitBinding(entry.value)}`)
        .join(", ");

      body = `UPDATE ${spec.table} SET ${assignments}${emitWhere(spec.filters)};`;
      break;
    }
    case "DELETE": {
      body = `DELETE FROM ${spec.table}${emitWhere(spec.filters)};`;
      break;
    }
  }

  assertBodySafe(body);

  return body;
}

// Every `{{ ... }}` in the compiled body must be a compiler-emitted binding: either a dotted identifier path or a
// JSON scalar literal. Anything else (or a stray `${`/backtick) means a bug or an escape — reject.
const SAFE_BINDING =
  /^\{\{ (?:[A-Za-z_][A-Za-z0-9_.]*|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|true|false|null) \}\}$/;

function assertBodySafe(body: string): void {
  if (body.length === 0) throw new Error("compiled query is empty");

  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("compiled query exceeds the size limit");
  }

  if (/\$\{|`/.test(body)) {
    throw new Error("compiled query contains forbidden template syntax");
  }

  // Each binding is validated at emission (emitBinding), so here we only guard the aggregate: `{{` and `}}` must be
  // balanced. Unbalanced braces would mean a bug produced a malformed body — reject rather than persist it.
  const opens = (body.match(/\{\{/g) ?? []).length;
  const closes = (body.match(/\}\}/g) ?? []).length;

  if (opens !== closes) {
    throw new Error("compiled query has unbalanced bindings");
  }
}

// Build the ActionDTO for POST /api/v1/actions. Datasource is an EMBEDDED { id } object (server derives
// workspace/plugin from it); prepared statements are forced ON so values bind as parameters.
export function buildActionDto(
  spec: QuerySpec,
  body: string,
): Record<string, unknown> {
  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    actionConfiguration: {
      body,
      // SQL plugins read the prepared-statement flag from pluginSpecifiedTemplates[0].value.
      pluginSpecifiedTemplates: [{ value: true }],
    },
  };
}
