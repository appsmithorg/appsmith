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

// A CLOSED set of aggregate functions. The SQL keyword is compiler-emitted from the enum, never interpolated from
// agent text; the alias is the fn name itself (also from the enum), so agents/queries can reference the result column
// by a stable, safe name.
const AGGREGATE_FNS = {
  count: "COUNT",
  sum: "SUM",
  avg: "AVG",
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
    // SELECT ordering: each column is an allow-listed identifier; direction is a two-value enum (never interpolated
    // raw). Emitted as `ORDER BY "<col>" <DIR>, ...`.
    orderBy: z
      .array(
        z
          .object({
            column: sqlIdentifier,
            direction: z.enum(["ASC", "DESC"]),
          })
          .strict(),
      )
      .max(20)
      .optional(),
    // SELECT aggregation over a CLOSED set of functions. `count` may omit the column (COUNT(*)); `sum`/`avg` require a
    // column (enforced in the compiler). Pair with `groupBy` for grouped rollups.
    aggregate: z
      .object({
        fn: z.enum(["count", "sum", "avg"]),
        column: sqlIdentifier.optional(),
      })
      .strict()
      .optional(),
    // GROUP BY columns for an aggregated SELECT — each an allow-listed identifier, emitted quoted.
    groupBy: z.array(sqlIdentifier).max(20).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
  })
  .strict()
  // orderBy/aggregate/groupBy shape a SELECT only; compileQuery ignores them on INSERT/UPDATE/DELETE. Reject them
  // there so an agent gets clear feedback instead of a silently-dropped clause.
  .superRefine((spec, ctx) => {
    if (spec.operation === "SELECT") return;

    for (const field of ["orderBy", "aggregate", "groupBy"] as const) {
      if (spec[field] !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} is only valid on a SELECT query`,
          path: [field],
        });
      }
    }
  });

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

// Emit `ORDER BY "col" ASC, "col2" DESC`. Columns are allow-listed identifiers (the charset admits no
// quote/backslash), so quoting them is safe and unquotable; direction comes from a two-value enum, never agent text.
function emitOrderBy(orderBy: QuerySpec["orderBy"]): string {
  if (!orderBy || orderBy.length === 0) return "";

  const clauses = orderBy.map(
    (entry) => `"${entry.column}" ${entry.direction}`,
  );

  return ` ORDER BY ${clauses.join(", ")}`;
}

// Emit `GROUP BY "col", "col2"`. Same allow-listed, quoted identifiers.
function emitGroupBy(groupBy: QuerySpec["groupBy"]): string {
  if (!groupBy || groupBy.length === 0) return "";

  const clauses = groupBy.map((column) => `"${column}"`);

  return ` GROUP BY ${clauses.join(", ")}`;
}

// Emit one aggregate select item, e.g. `COUNT(*) AS count`, `COUNT("id") AS count`, `SUM("amount") AS sum`. The
// function keyword and the alias both come from the closed AGGREGATE_FNS enum; the column (when present) is an
// allow-listed identifier emitted quoted. `sum`/`avg` require a column — a count-less aggregate is nonsensical.
function emitAggregate(aggregate: NonNullable<QuerySpec["aggregate"]>): string {
  const fn = AGGREGATE_FNS[aggregate.fn];

  if (aggregate.fn === "count") {
    const target = aggregate.column ? `"${aggregate.column}"` : "*";

    return `${fn}(${target}) AS ${aggregate.fn}`;
  }

  if (!aggregate.column) {
    throw new Error(`${aggregate.fn} aggregation requires a column`);
  }

  return `${fn}("${aggregate.column}") AS ${aggregate.fn}`;
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
      // Aggregated SELECT: the group-by columns (quoted) followed by the single aggregate item, e.g.
      // `SELECT "region", SUM("amount") AS sum`. Otherwise the plain column list (unquoted, matching the
      // existing convention) or `*`.
      let selectList: string;

      if (spec.aggregate) {
        const groupCols = (spec.groupBy ?? []).map((column) => `"${column}"`);

        selectList = [...groupCols, emitAggregate(spec.aggregate)].join(", ");
      } else {
        selectList =
          spec.columns && spec.columns.length > 0
            ? spec.columns.join(", ")
            : "*";
      }

      const limit = spec.limit !== undefined ? ` LIMIT ${spec.limit}` : "";

      // SQL clause order: SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY ... LIMIT.
      body = `SELECT ${selectList} FROM ${spec.table}${emitWhere(spec.filters)}${emitGroupBy(spec.groupBy)}${emitOrderBy(spec.orderBy)}${limit};`;
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
    // A SELECT is a data fetch: run it on page load so a bound widget populates without a manual trigger (the query
    // is created after the layout, so the server's on-load analysis doesn't pick it up). Writes stay manual.
    executeOnLoad: spec.operation === "SELECT",
    actionConfiguration: {
      body,
      // SQL plugins read the prepared-statement flag from pluginSpecifiedTemplates[0].value.
      pluginSpecifiedTemplates: [{ value: true }],
    },
  };
}
