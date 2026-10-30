import { createHash } from "node:crypto";
import { z } from "zod";
import { RAW_EXPRESSION, storedId } from "./schema.js";

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
// U+2028/U+2029 are included for the same reason schema.ts documents: JSON.stringify does NOT escape them,
// so a value carrying one can break out of the emitted string literal on an older JS engine.
// Numbers must be finite: JSON input such as 1e999 parses to Infinity, which JSON.stringify emits as null, so the
// literal would silently bind NULL.
const literalScalar = z.union([
  z
    .string()
    .max(1000)
    .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  z.number().finite(),
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
  ilike: "ILIKE",
  in: "IN",
} as const;

// Where `like` and `ilike` add the % wildcard. The % is added to the bound VALUE, never to the SQL text. `exact` adds
// none, which is also what a like filter with no `match` does. A % or _ inside the value itself still acts as a
// wildcard.
const LIKE_MATCHES = ["contains", "prefix", "suffix", "exact"] as const;

type LikeMatch = (typeof LIKE_MATCHES)[number];

function isWildcardMatch(match: LikeMatch | undefined): boolean {
  return match !== undefined && match !== "exact";
}

function withWildcards(text: string, match: LikeMatch): string {
  const before = match === "contains" || match === "suffix" ? "%" : "";
  const after = match === "contains" || match === "prefix" ? "%" : "";

  return `${before}${text}${after}`;
}

// Filters that test a column for NULL. The SQL is fixed text from these maps, so they take no value.
// The MySQL plugin refuses any query with the word IS while prepared statements are on, and the compiler always turns
// them on. MySQL uses its null-safe equality `<=>` instead.
const NULL_OPERATORS = {
  isNull: "IS NULL",
  notNull: "IS NOT NULL",
} as const;
const MYSQL_NULL_TEMPLATES = {
  isNull: (column: string) => `${column} <=> NULL`,
  notNull: (column: string) => `NOT (${column} <=> NULL)`,
} as const;

type NullOperator = keyof typeof NULL_OPERATORS;

function isNullOperator(op: string): op is NullOperator {
  return Object.prototype.hasOwnProperty.call(NULL_OPERATORS, op);
}

// A WHERE filter.
// - `inList` matches the column against a list that a widget holds, such as a multi-select's selectedOptionValues.
// - `skipWhenEmpty` drops the filter while the widget value is empty (null, undefined, "" or []). An unset dropdown
//   then means "no filter", not "match nothing".
// - `isNull` and `notNull` take no value and no skipWhenEmpty. Every other op needs a value.
// inList and skipWhenEmpty need a widget reference. A literal is a scalar and is never empty.
const filterSchema = z
  .object({
    column: sqlIdentifier,
    op: z.enum([
      "eq",
      "ne",
      "gt",
      "gte",
      "lt",
      "lte",
      "like",
      "ilike",
      "in",
      "inList",
      "isNull",
      "notNull",
    ]),
    value: valueRef.optional(),
    skipWhenEmpty: z.boolean().optional(),
    match: z.enum(LIKE_MATCHES).optional(),
  })
  .strict()
  .superRefine((filter, ctx) => {
    if (filter.match !== undefined) {
      if (filter.op !== "like" && filter.op !== "ilike") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "match is only valid with like or ilike",
          path: ["match"],
        });
      } else if (
        isWildcardMatch(filter.match) &&
        filter.value !== undefined &&
        "literal" in filter.value &&
        typeof filter.value.literal !== "string"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `match "${filter.match}" needs a string literal or a { widget, property } value`,
          path: ["value"],
        });
      }
    }

    if (isNullOperator(filter.op)) {
      // skipWhenEmpty: false is a no-op, so it is accepted.
      if (filter.value !== undefined || filter.skipWhenEmpty === true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${filter.op} takes no value and no skipWhenEmpty`,
          path: [filter.value !== undefined ? "value" : "skipWhenEmpty"],
        });
      }

      return;
    }

    if (filter.value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${filter.op} needs a value: { literal } or { widget, property }`,
        path: ["value"],
      });

      return;
    }

    // `appsmith.*` (for example appsmith.user.email) identifies the viewer, and filters use it to scope rows. Never
    // skip it: an unset value would silently widen the read to every row.
    if (
      filter.skipWhenEmpty === true &&
      "widget" in filter.value &&
      filter.value.widget === "appsmith"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "skipWhenEmpty cannot be used on an appsmith.* value — it may be scoping rows to the viewer",
        path: ["skipWhenEmpty"],
      });
    }

    if (!("literal" in filter.value)) return;

    if (filter.op === "inList") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "inList needs a { widget, property } value that holds a list (e.g. a multi-select's selectedOptionValues)",
        path: ["value"],
      });
    }

    if (filter.skipWhenEmpty === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "skipWhenEmpty needs a { widget, property } value — a literal is never empty",
        path: ["skipWhenEmpty"],
      });
    }
  });

const SKIP_IN_GROUP_MESSAGE =
  "skipWhenEmpty cannot be used inside anyOf: in an OR, a skipped member would match every row";

// An OR group: `{ anyOf: [filter, filter, ...] }` compiles to `(a OR b OR ...)` and is ANDed with the other filters.
// - Members are plain filters, so groups nest one level only.
// - Members cannot use skipWhenEmpty. A skipped filter compiles to TRUE, and inside an OR that makes the whole group
//   TRUE, so one empty control would match every row, even on a SELECT.
const filterGroupSchema = z
  .object({
    anyOf: z.array(filterSchema).min(2).max(10),
  })
  .strict()
  .superRefine((group, ctx) => {
    group.anyOf.forEach((member, index) => {
      if (member.skipWhenEmpty === true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: SKIP_IN_GROUP_MESSAGE,
          path: ["anyOf", index, "skipWhenEmpty"],
        });
      }
    });
  });

// One entry of `filters`: a plain filter or an OR group. An own `anyOf` key decides which, so an agent gets the errors
// for the shape it meant instead of a union of both. It returns the parsed entry, not the raw input, so any default or
// transform in either schema applies.
const filterEntrySchema = z
  .unknown()
  .transform(
    (
      entry,
      ctx,
    ): z.infer<typeof filterSchema> | z.infer<typeof filterGroupSchema> => {
      const isGroup =
        typeof entry === "object" &&
        entry !== null &&
        Object.prototype.hasOwnProperty.call(entry, "anyOf");
      const result = (isGroup ? filterGroupSchema : filterSchema).safeParse(
        entry,
      );

      if (!result.success) {
        result.error.issues.forEach((issue) => ctx.addIssue(issue));

        return z.NEVER;
      }

      return result.data;
    },
  );

// The database family the query runs on. `inList` works only on PostgreSQL, which binds a list as one
// prepared-statement parameter (an SQL array). MySQL sends the list as a JSON string, and SQL Server refuses it.
// isNull and notNull compile differently on MySQL (see MYSQL_NULL_TEMPLATES), and Redshift uses the PostgreSQL form
// for them. Redshift is otherwise "other": it cannot bind a list as one parameter, so inList stays refused there.
// Everything else the compiler emits works on every family. An unknown family, such as when the caller cannot
// resolve the datasource, counts as "other".
export type SqlDialect = "postgres" | "redshift" | "mysql" | "other";

// Maps a datasource's plugin package name to its SqlDialect. MariaDB counts as MySQL.
export function sqlDialectFor(packageName: string | undefined): SqlDialect {
  switch (packageName) {
    case "postgres-plugin":
      return "postgres";
    case "redshift-plugin":
      return "redshift";
    case "mysql-plugin":
    case "mariadb-plugin":
      return "mysql";
    default:
      return "other";
  }
}

export interface CompileQueryOptions {
  dialect?: SqlDialect;
}

// A selected or grouped column. A plain name, or `{ column, coalesce: { literal } }`, which reads a fallback for
// NULL and keeps the column's name: `COALESCE(col, {{ literal }}) AS col`. The fallback is a bound parameter. It
// cannot be null (COALESCE with NULL changes nothing) or a widget value.
const coalesceColumnSchema = z
  .object({
    column: sqlIdentifier,
    coalesce: z
      .object({
        literal: literalScalar.refine(
          (value) => value !== null,
          "coalesce needs a non-null literal",
        ),
      })
      .strict(),
  })
  .strict();

// A groupBy column that holds a delimited list, such as "billing, export". `{ column, split: "," }` groups by each
// trimmed item instead of the whole value (PostgreSQL only). The split becomes a lateral source in FROM, and GROUP BY,
// HAVING and the select list all use that item. The separator is a bound parameter.
// - A row whose column is NULL or '' has no items, so it is left out of every group (CROSS JOIN).
// - An empty item inside a value ("a,,b" or "a,") is kept and forms its own '' group. A having `ne ''` drops it.
// - A WHERE filter on the same column still tests the whole stored value, not an item.
const splitColumnSchema = z
  .object({
    column: sqlIdentifier,
    split: z
      .string()
      .min(1)
      .max(10)
      .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  })
  .strict();

const selectColumnSchema = z.union([
  sqlIdentifier,
  coalesceColumnSchema,
  splitColumnSchema,
]);

type SelectColumn = z.infer<typeof selectColumnSchema>;
type SplitColumn = z.infer<typeof splitColumnSchema>;

function isSplitColumn(entry: SelectColumn): entry is SplitColumn {
  return typeof entry !== "string" && "split" in entry;
}

function isCoalesceColumn(
  entry: SelectColumn,
): entry is z.infer<typeof coalesceColumnSchema> {
  return typeof entry !== "string" && "coalesce" in entry;
}

// The lateral source a split column reads from. The names are fixed text, and the item column has a name a table is
// unlikely to use, so a WHERE filter on the table's own columns stays unambiguous.
const SPLIT_SOURCE = "mcp_split";
const SPLIT_ITEM = `TRIM(${SPLIT_SOURCE}.mcp_split_value)`;

function columnNameOf(entry: SelectColumn): string {
  return typeof entry === "string" ? entry : entry.column;
}

// The comparisons a HAVING condition can use. The SQL comes from this map.
const HAVING_OPERATORS = {
  eq: "=",
  ne: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
} as const;

// One HAVING condition on an aggregated SELECT. `column` names either the aggregate's result (its fn, such as
// "count") or one of the groupBy columns; querySpecSchema checks which. It is its own schema, not a WHERE filter: it
// has no groups, no skipWhenEmpty, no like and no null tests, and it never uses the WHERE filters' column forms.
// A null literal is refused: `= NULL` and `!= NULL` never match, so the condition would silently drop every group.
const havingConditionSchema = z
  .object({
    column: sqlIdentifier,
    op: z.enum(["eq", "ne", "gt", "gte", "lt", "lte"]),
    value: valueRef.refine(
      (value) => !("literal" in value && value.literal === null),
      "having cannot compare with null: = NULL never matches",
    ),
  })
  .strict();

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
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
    table: qualifiedName,
    columns: z.array(selectColumnSchema).max(100).optional(),
    filters: z.array(filterEntrySchema).max(20).optional(),
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
    // GROUP BY columns for an aggregated SELECT — each an allow-listed identifier, quoted by quoteIdentifier (bare on
    // MySQL).
    groupBy: z.array(selectColumnSchema).max(20).optional(),
    // HAVING conditions on an aggregated SELECT, ANDed together.
    having: z.array(havingConditionSchema).max(10).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
  })
  .strict()
  // orderBy/aggregate/groupBy shape a SELECT only; compileQuery ignores them on INSERT/UPDATE/DELETE. Reject them
  // there so an agent gets clear feedback instead of a silently-dropped clause.
  .superRefine((spec, ctx) => {
    // HAVING filters groups, so it needs an aggregate, and each condition must name the aggregate's result or a group
    // column. A name the select list does not group would fail at run time, or test something the agent did not mean.
    if (spec.having !== undefined) {
      if (spec.aggregate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "having needs an aggregate",
          path: ["having"],
        });
      } else {
        const fn = spec.aggregate.fn;
        const groupBy = spec.groupBy ?? [];
        const groupColumns = new Set(groupBy.map(columnNameOf));
        const coalescedColumns = new Set(
          groupBy.filter(isCoalesceColumn).map(columnNameOf),
        );

        spec.having.forEach((condition, index) => {
          if (condition.column !== fn && !groupColumns.has(condition.column)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `having can only test "${fn}" or a groupBy column`,
              path: ["having", index, "column"],
            });
          } else if (coalescedColumns.has(condition.column)) {
            // HAVING would test the stored value, not the fallback the select list shows, so an agent testing the
            // label it sees would get the wrong groups.
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "having cannot test a groupBy column that has coalesce (it would test the stored value, not the fallback shown)",
              path: ["having", index, "column"],
            });
          }
        });
      }
    }

    // A group column named like the aggregate's result (for example "count" with aggregate count) gives the result
    // two columns of that name, and having could not tell them apart. The match ignores case: MySQL names are bare and
    // case-insensitive, so "COUNT" and count are the same name there.
    if (spec.aggregate !== undefined) {
      const fn = spec.aggregate.fn;

      (spec.groupBy ?? []).forEach((entry, index) => {
        if (columnNameOf(entry).toLowerCase() === fn) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `a groupBy column cannot be named "${fn}", the name of the aggregate's result`,
            path: ["groupBy", index],
          });
        }
      });
    }

    // A grouped column's coalesce or split appears in the aggregated select list only. Without an aggregate the select
    // list is `columns` or `*`, so it would be dropped without a word.
    if (spec.aggregate === undefined) {
      (spec.groupBy ?? []).forEach((entry, index) => {
        if (isCoalesceColumn(entry)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "coalesce on a groupBy column needs an aggregate; to coalesce a plain column, put it in columns",
            path: ["groupBy", index, "coalesce"],
          });
        } else if (isSplitColumn(entry)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "split on a groupBy column needs an aggregate",
            path: ["groupBy", index, "split"],
          });
        }
      });
    } else {
      // With an aggregate, the select list is the group columns and the aggregate only, so a `columns` coalesce would
      // be dropped without a word too. Plain `columns` entries stay ignored, as before.
      (spec.columns ?? []).forEach((entry, index) => {
        if (typeof entry !== "string") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "coalesce in columns is ignored when an aggregate is set; put the column in groupBy instead",
            path: ["columns", index, "coalesce"],
          });
        }
      });
    }

    // With a split, each group key needs its own name: the select list shows each under its column's name, and having
    // finds a key by that name. A repeat (such as "tags" plain and "tags" split) would give two columns of one name.
    // Without a split, a repeated group column stays accepted, as before.
    const hasSplit = (spec.groupBy ?? []).some(isSplitColumn);
    const seenGroupColumns = new Set<string>();

    (spec.groupBy ?? []).forEach((entry, index) => {
      const name = columnNameOf(entry);

      if (hasSplit && seenGroupColumns.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `groupBy lists "${name}" more than once`,
          path: ["groupBy", index],
        });
      }

      seenGroupColumns.add(name);
    });

    // The split source is named mcp_split with the item column mcp_split_value. With a split present, a table of that
    // name would collide with it, and a column of either name would bind to the split source instead of the table.
    if (hasSplit) {
      if (spec.table.split(".").pop()?.toLowerCase() === SPLIT_SOURCE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `split cannot be used on a table named ${SPLIT_SOURCE}`,
          path: ["table"],
        });
      }

      const reserved = new Set([SPLIT_SOURCE, `${SPLIT_SOURCE}_value`]);
      const refuse = (column: string, path: (string | number)[]) => {
        if (reserved.has(column.toLowerCase())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `with split, a column cannot be named ${column} (that name is reserved for the split source)`,
            path,
          });
        }
      };

      (spec.filters ?? []).forEach((entry, index) => {
        if (typeof entry !== "object" || entry === null) return;

        if (isFilterGroup(entry)) {
          entry.anyOf.forEach((member, memberIndex) =>
            refuse(member.column, [
              "filters",
              index,
              "anyOf",
              memberIndex,
              "column",
            ]),
          );
        } else if (typeof entry.column === "string") {
          refuse(entry.column, ["filters", index, "column"]);
        }
      });
      (spec.columns ?? []).forEach((entry, index) =>
        refuse(columnNameOf(entry), ["columns", index]),
      );
      (spec.orderBy ?? []).forEach((entry, index) =>
        refuse(entry.column, ["orderBy", index, "column"]),
      );
      (spec.having ?? []).forEach((entry, index) =>
        refuse(entry.column, ["having", index, "column"]),
      );
      // Every group column (the split one too) and the aggregate's column: a reserved name there would group or count
      // the split source instead of the table.
      (spec.groupBy ?? []).forEach((entry, index) =>
        refuse(columnNameOf(entry), ["groupBy", index]),
      );

      if (spec.aggregate?.column !== undefined) {
        refuse(spec.aggregate.column, ["aggregate", "column"]);
      }
    }

    // A query has one lateral split source, so one split column.
    (spec.groupBy ?? []).filter(isSplitColumn).forEach((entry, splitIndex) => {
      if (splitIndex === 0) return;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "only one groupBy column can use split",
        path: ["groupBy", (spec.groupBy ?? []).indexOf(entry), "split"],
      });
    });

    // A split item is a group key. In columns it would have no meaning.
    (spec.columns ?? []).forEach((entry, index) => {
      if (isSplitColumn(entry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "split is only valid in groupBy",
          path: ["columns", index, "split"],
        });
      }
    });

    if (spec.operation === "SELECT") return;

    // A skipped filter widens the WHERE clause. That is harmless on a read. On UPDATE or DELETE, an empty widget would
    // turn "change the selected rows" into "change every row", so writes refuse skipWhenEmpty. The check also looks
    // inside OR groups. filterGroupSchema already refuses skipWhenEmpty there, so this is a second guard.
    // A malformed entry (null, a number, `{ anyOf: "x" }`) already has its own issue from filterEntrySchema, and this
    // refinement can still see it in raw form. Skip anything that is not a filter or a group so it reports that issue
    // instead of throwing.
    (spec.filters ?? []).forEach((entry, index) => {
      if (typeof entry !== "object" || entry === null) return;

      if ("anyOf" in entry && !Array.isArray(entry.anyOf)) return;

      const members = isFilterGroup(entry)
        ? entry.anyOf.map((member, memberIndex) => ({
            member,
            path: ["filters", index, "anyOf", memberIndex, "skipWhenEmpty"],
          }))
        : [{ member: entry, path: ["filters", index, "skipWhenEmpty"] }];

      members.forEach(({ member, path }) => {
        if (member.skipWhenEmpty === true) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "skipWhenEmpty is only valid on a SELECT query (on a write, an empty value would widen it to every row)",
            path,
          });
        }

        // An empty search value compiles to "%%", which matches every row, so a wildcard would widen a write.
        if (isWildcardMatch(member.match)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'a wildcard match is only valid on a SELECT query (an empty value would match every row); use match: "exact" on a write',
            path: [...path.slice(0, -1), "match"],
          });
        }

        // A widget value in a like or ilike is a pattern the end user writes: typing "%" would match every row.
        if (
          (member.op === "like" || member.op === "ilike") &&
          member.value !== undefined &&
          "widget" in member.value
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "like and ilike with a { widget, property } value are only valid on a SELECT query (the end user could type % and match every row); use eq on a write",
            path: [...path.slice(0, -1), "value"],
          });
        }
      });
    });

    for (const field of [
      "orderBy",
      "aggregate",
      "groupBy",
      "having",
    ] as const) {
      if (spec[field] !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} is only valid on a SELECT query`,
          path: [field],
        });
      }
    }

    // Plain columns on a write have always been ignored, and still are. A coalesce entry is refused instead, so the
    // agent learns it has no effect.
    (spec.columns ?? []).forEach((entry, index) => {
      if (isCoalesceColumn(entry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "coalesce is only valid on a SELECT query",
          path: ["columns", index, "coalesce"],
        });
      }
    });
  });

export type QuerySpec = z.infer<typeof querySpecSchema>;
type ValueRef = z.infer<typeof valueRef>;
type WidgetRef = Extract<ValueRef, { widget: string }>;
type Filter = z.infer<typeof filterSchema>;
type FilterGroup = z.infer<typeof filterGroupSchema>;

function isFilterGroup(entry: Filter | FilterGroup): entry is FilterGroup {
  return Array.isArray((entry as Partial<FilterGroup>).anyOf);
}

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

// Template text that tests whether a widget value is empty, around a validated identifier path.
// null, undefined, "" and [] are empty. 0, false and non-empty strings or arrays are not (`.length` is undefined
// for 0 and false).
function emptyTest(ref: WidgetRef): string {
  const path = `${ref.widget}.${ref.property}`;

  return `(${path} == null || ${path}.length === 0)`;
}

// Binds `1` while the widget value is empty, and `0` otherwise. It binds an integer, not a boolean, so `<guard> = 1`
// is valid SQL on every supported database. SQL Server and Oracle do not accept a bound boolean as a predicate.
function emitEmptyGuard(ref: WidgetRef): string {
  const binding = `{{ ${emptyTest(ref)} ? 1 : 0 }}`;

  if (!EMPTY_GUARD_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  return binding;
}

// Binds the widget value, or `null` while it is empty. It never binds an empty value as-is: "" would be compared
// with a typed column (an integer column, for example), and PostgreSQL leaves an empty array parameter unset, which
// fails the whole query.
function emitNullWhenEmpty(ref: WidgetRef): string {
  const path = `${ref.widget}.${ref.property}`;
  const binding = `{{ ${emptyTest(ref)} ? null : ${path} }}`;

  if (!NULL_WHEN_EMPTY_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  return binding;
}

// Binds a like value with its wildcards. A literal gets them at compile time, so it stays a plain JSON string binding.
// A widget value gets them at run time, from fixed template text around one identifier path. A null or undefined
// widget value binds as "" plus the wildcards.
function emitWildcardBinding(value: ValueRef, match: LikeMatch): string {
  if ("literal" in value) {
    if (typeof value.literal !== "string") {
      throw new Error(`match "${match}" needs a string literal`);
    }

    return emitBinding({ literal: withWildcards(value.literal, match) });
  }

  const path = `${value.widget}.${value.property}`;
  const before = match === "contains" || match === "suffix" ? '"%" + ' : "";
  const after = match === "contains" || match === "prefix" ? ' + "%"' : "";
  const binding = `{{ ${before}(${path} ?? "")${after} }}`;

  if (!WILDCARD_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  return binding;
}

// Returns the value of a filter that needs one. filterSchema already refuses a missing value. This checks again so
// that a caller that skipped parsing fails closed, instead of emitting `col = undefined`.
function filterValue(filter: Filter): ValueRef {
  if (filter.value === undefined) {
    throw new Error(
      `filter on ${filter.column} needs a value for ${filter.op}`,
    );
  }

  return filter.value;
}

// Returns the widget reference of an inList or skipWhenEmpty filter. filterSchema already refuses a literal here.
// This checks again so that a caller that skipped parsing fails closed, instead of emitting a template around a
// literal.
function widgetRef(filter: Filter): WidgetRef {
  const value = filterValue(filter);

  if ("literal" in value) {
    throw new Error(
      `filter on ${filter.column} needs a { widget, property } value for ${filter.op === "inList" ? "inList" : "skipWhenEmpty"}`,
    );
  }

  return value;
}

// The longest name each database keeps. PostgreSQL cuts every name, quoted or not, to 63 bytes. Redshift allows
// 127 bytes. Identifiers here are ASCII, so bytes are characters.
const MAX_IDENTIFIER_LENGTH = { postgres: 63, redshift: 127 } as const;

// The PostgreSQL or Redshift column for an isNull or notNull filter: lower-cased, then quoted. Throws when the name
// equals the table's own name (the last part of `schema.table`), because a missing column of that name reads as the
// whole row. Both names are compared after the database's own cut, so two long names that differ only after it
// still match.
function postgresNullCheckColumn(
  column: string,
  table: string,
  dialect: "postgres" | "redshift",
): string {
  const name = column.toLowerCase();
  const tableName = (table.split(".").pop() ?? table).toLowerCase();
  const maxLength = MAX_IDENTIFIER_LENGTH[dialect];

  if (name.slice(0, maxLength) === tableName.slice(0, maxLength)) {
    throw new Error(
      `isNull and notNull cannot test a column named like its table (${column}) on PostgreSQL or Redshift, which would read it as the whole row`,
    );
  }

  return `"${name}"`;
}

// The isNull or notNull test for a table-qualified column on every database except PostgreSQL.
function emitQualifiedNullCheck(
  op: NullOperator,
  column: string,
  dialect: SqlDialect,
): string {
  return dialect === "mysql"
    ? MYSQL_NULL_TEMPLATES[op](column)
    : `${column} ${NULL_OPERATORS[op]}`;
}

// One WHERE condition, before any skipWhenEmpty wrapping.
function emitCondition(
  filter: Filter,
  dialect: SqlDialect,
  table: string,
): string {
  // The SQL comes from NULL_OPERATORS or MYSQL_NULL_TEMPLATES. No agent text and no binding.
  // An allow-listed identifier can still be a keyword, such as `null` or `current_user`. A bare `null IS NULL` is true
  // for every row, which would widen a DELETE to the whole table. So the column is never emitted bare:
  // - PostgreSQL: lower-cased and quoted. Lower-casing gives the same column an unquoted value filter names, because
  //   PostgreSQL folds unquoted names to lower case. Not `table.col`: when no such column exists, PostgreSQL reads
  //   `users.text` as the call `text(users)`, which is never NULL. A missing quoted column is an error, except a
  //   name equal to the table's, which PostgreSQL reads as the whole row. That name is refused.
  // - Redshift: the PostgreSQL form. Redshift derives from PostgreSQL, so `table.col` could have the same
  //   function-call reading. A quoted bare name cannot.
  // - Every other database: qualified with its table. After a dot, MySQL always reads a column name. SQL Server,
  //   Oracle and Snowflake read a column or refuse the query.
  if (isNullOperator(filter.op)) {
    return dialect === "postgres" || dialect === "redshift"
      ? `${postgresNullCheckColumn(filter.column, table, dialect)} ${NULL_OPERATORS[filter.op]}`
      : emitQualifiedNullCheck(filter.op, `${table}.${filter.column}`, dialect);
  }

  if (filter.op === "inList") {
    if (dialect !== "postgres") {
      throw new Error(
        `inList (filter on ${filter.column}) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select`,
      );
    }

    // CAST both sides to text. A select holds string option values, and this lets them match both text and numeric
    // columns. The list binds as one SQL array parameter. A null list (an empty selection) matches nothing.
    return `CAST(${filter.column} AS TEXT) = ANY(CAST(${emitNullWhenEmpty(widgetRef(filter))} AS TEXT[]))`;
  }

  // Redshift has ILIKE, but its plugin runs queries without prepared statements, so a bound pattern is not a
  // parameter there. Only PostgreSQL is supported.
  if (filter.op === "ilike" && dialect !== "postgres") {
    throw new Error(
      `ilike (filter on ${filter.column}) is only available on a PostgreSQL datasource; on MySQL, like is already case-insensitive for most collations`,
    );
  }

  // A like or ilike with a wildcard binds the value with the % around it, so the SQL text stays `col LIKE {{ ... }}`.
  // An empty widget value binds "%%". On a SELECT that matches every row, and writes refuse a wildcard match.
  if (
    (filter.op === "like" || filter.op === "ilike") &&
    filter.match !== undefined &&
    isWildcardMatch(filter.match)
  ) {
    return `${filter.column} ${OPERATORS[filter.op]} ${emitWildcardBinding(filterValue(filter), filter.match)}`;
  }

  // On PostgreSQL, a skipWhenEmpty filter binds null while the widget value is empty. "" against a typed column (an
  // integer column, for example) fails to prepare, even though the guard short-circuits.
  // On other databases, the empty value binds as-is: MySQL and SQL Server coerce "", and Oracle treats "" as NULL.
  // This avoids an untyped NULL parameter, which some JDBC drivers (Oracle's) reject.
  const binding =
    filter.skipWhenEmpty === true && dialect === "postgres"
      ? emitNullWhenEmpty(widgetRef(filter))
      : emitBinding(filterValue(filter));

  if (filter.op === "in") return `${filter.column} IN (${binding})`;

  return `${filter.column} ${OPERATORS[filter.op]} ${binding}`;
}

// Quote an allow-listed column identifier for the dialect. MySQL and MariaDB read "col" as a string unless the
// server runs with ANSI_QUOTES, which groups and sorts by a constant. Backtick quoting is not an option:
// assertBodySafe refuses any backtick in a body. So MySQL gets the bare identifier, as plain select columns already
// do. The identifier charset admits no quote or backslash, so a bare name cannot break out. A column named after a
// reserved word then fails with a syntax error instead of returning wrong results.
function quoteIdentifier(name: string, dialect: SqlDialect): string {
  return dialect === "mysql" ? name : `"${name}"`;
}

// Emit `ORDER BY "col" ASC, "col2" DESC` (bare names on MySQL, see quoteIdentifier). Direction comes from a two-value
// enum, never agent text.
function emitOrderBy(
  orderBy: QuerySpec["orderBy"],
  dialect: SqlDialect,
): string {
  if (!orderBy || orderBy.length === 0) return "";

  const clauses = orderBy.map(
    (entry) => `${quoteIdentifier(entry.column, dialect)} ${entry.direction}`,
  );

  return ` ORDER BY ${clauses.join(", ")}`;
}

// Emit `GROUP BY "col", "col2"`. Same allow-listed identifiers, quoted by quoteIdentifier (bare on MySQL).
function emitGroupBy(
  groupBy: QuerySpec["groupBy"],
  dialect: SqlDialect,
): string {
  if (!groupBy || groupBy.length === 0) return "";

  // Group by the stored column, even when the select list coalesces it. NULLs form their own group, and the select
  // list then shows that group under the fallback.
  const clauses = groupBy.map((entry) => groupKeyExpression(entry, dialect));

  return ` GROUP BY ${clauses.join(", ")}`;
}

// The SQL a group key compiles to, shared by GROUP BY, HAVING and the aggregated select list, so all three name the
// same thing. A split column's key is the trimmed item from the lateral split source. Every other column's key is its
// stored name, quoted by quoteIdentifier (bare on MySQL).
function groupKeyExpression(entry: SelectColumn, dialect: SqlDialect): string {
  if (isSplitColumn(entry)) return SPLIT_ITEM;

  return quoteIdentifier(columnNameOf(entry), dialect);
}

// One select-list item. `quote` matches the list's own style: plain columns are emitted bare, group columns quoted.
// - A coalesce entry keeps the column's name as its alias, and its fallback is a bound parameter.
// - A split entry shows its item under the column's name.
function emitSelectColumn(
  entry: SelectColumn,
  quote: boolean,
  dialect: SqlDialect,
): string {
  if (isSplitColumn(entry)) {
    if (!quote) {
      throw new Error("split is only valid in groupBy");
    }

    return `${SPLIT_ITEM} AS ${quoteIdentifier(entry.column, dialect)}`;
  }

  const name = quote ? groupKeyExpression(entry, dialect) : columnNameOf(entry);

  if (typeof entry === "string") return name;

  return `COALESCE(${name}, ${emitBinding(entry.coalesce)}) AS ${name}`;
}

// The FROM clause: the table, plus the lateral split source when a group column uses split (PostgreSQL only). The
// separator is a bound parameter, and the source and item names are fixed text.
function emitFrom(spec: QuerySpec, dialect: SqlDialect): string {
  const split = (spec.groupBy ?? []).find(isSplitColumn);

  if (split === undefined) return spec.table;

  if (dialect !== "postgres") {
    throw new Error(
      `split (on ${split.column}) is only available on a PostgreSQL datasource, which can unnest an array`,
    );
  }

  return `${spec.table} CROSS JOIN LATERAL unnest(string_to_array("${split.column}", ${emitBinding({ literal: split.split })})) AS ${SPLIT_SOURCE}(mcp_split_value)`;
}

// Emit one aggregate select item, e.g. `COUNT(*) AS count`, `COUNT("id") AS count`, `SUM("amount") AS sum`. The
// function keyword and the alias both come from the closed AGGREGATE_FNS enum; the column (when present) is an
// allow-listed identifier quoted by quoteIdentifier (bare on MySQL). `sum`/`avg` require a column — a count-less
// aggregate is nonsensical.
function emitAggregate(
  aggregate: NonNullable<QuerySpec["aggregate"]>,
  dialect: SqlDialect,
): string {
  return `${aggregateExpression(aggregate, dialect)} AS ${aggregate.fn}`;
}

// The aggregate call without its alias, such as `COUNT(*)` or `SUM("amount")`. HAVING repeats it, because PostgreSQL
// does not accept a select-list alias there.
function aggregateExpression(
  aggregate: NonNullable<QuerySpec["aggregate"]>,
  dialect: SqlDialect,
): string {
  const fn = AGGREGATE_FNS[aggregate.fn];

  if (aggregate.fn === "count") {
    const target = aggregate.column
      ? quoteIdentifier(aggregate.column, dialect)
      : "*";

    return `${fn}(${target})`;
  }

  if (!aggregate.column) {
    throw new Error(`${aggregate.fn} aggregation requires a column`);
  }

  return `${fn}(${quoteIdentifier(aggregate.column, dialect)})`;
}

// Emit `HAVING <cond> AND ...`. Each condition tests the aggregate (its expression is repeated) or a group column (its
// stored name, quoted as GROUP BY quotes it). Values are bound parameters, and the operator comes from
// HAVING_OPERATORS.
function emitHaving(spec: QuerySpec, dialect: SqlDialect): string {
  if (!spec.having || spec.having.length === 0) return "";

  if (!spec.aggregate) {
    throw new Error("having needs an aggregate");
  }

  const aggregate = spec.aggregate;
  const conditions = spec.having.map((condition) => {
    const target =
      condition.column === aggregate.fn
        ? aggregateExpression(aggregate, dialect)
        : groupKeyExpression(
            (spec.groupBy ?? []).find(
              (entry) => columnNameOf(entry) === condition.column,
            ) ?? condition.column,
            dialect,
          );

    return `${target} ${HAVING_OPERATORS[condition.op]} ${emitBinding(condition.value)}`;
  });

  return ` HAVING ${conditions.join(" AND ")}`;
}

function emitWhere(
  filters: QuerySpec["filters"],
  dialect: SqlDialect,
  table: string,
): string {
  if (!filters || filters.length === 0) return "";

  const clauses = filters.map((entry) => {
    if (!isFilterGroup(entry)) return emitFilter(entry, dialect, table);

    const members = entry.anyOf.map((member) => {
      // filterGroupSchema refuses this. Check again so that a caller that skipped parsing fails closed, instead of
      // emitting a skip guard that makes the whole OR group TRUE.
      if (member.skipWhenEmpty === true) {
        throw new Error(SKIP_IN_GROUP_MESSAGE);
      }

      return emitCondition(member, dialect, table);
    });

    return `(${members.join(" OR ")})`;
  });

  return ` WHERE ${clauses.join(" AND ")}`;
}

// One plain filter, wrapped in its empty guard when it has skipWhenEmpty.
function emitFilter(
  filter: Filter,
  dialect: SqlDialect,
  table: string,
): string {
  const condition = emitCondition(filter, dialect, table);

  if (filter.skipWhenEmpty !== true) return condition;

  return `(${emitEmptyGuard(widgetRef(filter))} = 1 OR ${condition})`;
}

// Compile a structured spec into a parameterized SQL body. Throws on an empty/oversized body or if the emitted body
// somehow contains a brace pair that isn't a compiler-emitted binding (fail-closed defense-in-depth).
export function compileQuery(
  spec: QuerySpec,
  options: CompileQueryOptions = {},
): string {
  const dialect = options.dialect ?? "other";
  let body: string;

  switch (spec.operation) {
    case "SELECT": {
      // Aggregated SELECT: the group-by columns (quoted) followed by the single aggregate item, e.g.
      // `SELECT "region", SUM("amount") AS sum`. Otherwise the plain column list (unquoted, matching the
      // existing convention) or `*`.
      let selectList: string;

      if (spec.aggregate) {
        const groupCols = (spec.groupBy ?? []).map((entry) =>
          emitSelectColumn(entry, true, dialect),
        );

        selectList = [
          ...groupCols,
          emitAggregate(spec.aggregate, dialect),
        ].join(", ");
      } else {
        selectList =
          spec.columns && spec.columns.length > 0
            ? spec.columns
                .map((entry) => emitSelectColumn(entry, false, dialect))
                .join(", ")
            : "*";
      }

      const limit = spec.limit !== undefined ? ` LIMIT ${spec.limit}` : "";

      // SQL clause order: SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY ... LIMIT.
      body = `SELECT ${selectList} FROM ${emitFrom(spec, dialect)}${emitWhere(spec.filters, dialect, spec.table)}${emitGroupBy(spec.groupBy, dialect)}${emitHaving(spec, dialect)}${emitOrderBy(spec.orderBy, dialect)}${limit};`;
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

      body = `UPDATE ${spec.table} SET ${assignments}${emitWhere(spec.filters, dialect, spec.table)};`;
      break;
    }
    case "DELETE": {
      body = `DELETE FROM ${spec.table}${emitWhere(spec.filters, dialect, spec.table)};`;
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

// The only two expression bindings the compiler emits, for skipWhenEmpty and inList. Each is fixed template text
// around ONE identifier path. A backreference repeats the path, so a different path cannot be slipped into
// either position.
const EMPTY_GUARD_BINDING =
  /^\{\{ \(([A-Za-z_][A-Za-z0-9_.]*) == null \|\| \1\.length === 0\) \? 1 : 0 \}\}$/;
// The run-time wildcard binding for like and ilike: an optional leading "%", ONE identifier path with a "" fallback,
// and an optional trailing "%". Nothing else can appear.
const WILDCARD_BINDING =
  /^\{\{ (?:"%" \+ )?\([A-Za-z_][A-Za-z0-9_.]* \?\? ""\)(?: \+ "%")? \}\}$/;
const NULL_WHEN_EMPTY_BINDING =
  /^\{\{ \(([A-Za-z_][A-Za-z0-9_.]*) == null \|\| \1\.length === 0\) \? null : \1 \}\}$/;

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

// A stored SQL body that the MCP compiled starts with this marker line. It carries the sha256 of the rest of the
// body, so get_action can return a body the MCP wrote and still hide one that was edited afterwards, which may now
// hold a secret. The text tells editor users what it is.
// - It is a `--` line comment, not a block comment: the MySQL plugin strips only `--` comments before it reads the
//   first word to decide whether a query returns rows. A block comment would make every SELECT return a row count.
// - It is plain ASCII with no `;`, quote, `?` or `{{`, so no plugin's quote, statement or parameter scan can trip on it.
// - The hash is not keyed. A user who can edit the action could write a valid marker by hand; that only shows the
//   agent a body that same user can already read in the editor.
const MCP_BODY_MARKER =
  /^-- appsmith-mcp:v1 sha256=([0-9a-f]{64}) \(written by the Appsmith MCP server, editing it stops MCP clients from reading it\)\n/;

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// Prefix a compiled body with the MCP-authored marker. Call it on the body that is STORED, not the one returned to
// the agent.
export function markMcpAuthoredBody(body: string): string {
  return `-- appsmith-mcp:v1 sha256=${sha256Hex(body)} (written by the Appsmith MCP server, editing it stops MCP clients from reading it)\n${body}`;
}

// The compiled body of a stored action the MCP wrote, or undefined when the body has no marker or was changed after
// the MCP wrote it, including a change of line endings. A hand-written valid marker is the one exception (see
// MCP_BODY_MARKER).
export function mcpAuthoredBody(stored: unknown): string | undefined {
  if (typeof stored !== "string") return undefined;

  const match = MCP_BODY_MARKER.exec(stored);

  if (!match) return undefined;

  const body = stored.slice(match[0].length);

  return sha256Hex(body) === match[1] ? body : undefined;
}

// A stored body without its leading marker line, whether or not the hash still matches. For classifying what a query
// does (such as whether it writes), never for deciding whether to show the body: that is mcpAuthoredBody's job.
export function withoutMcpMarker(stored: string): string {
  const match = MCP_BODY_MARKER.exec(stored);

  return match ? stored.slice(match[0].length) : stored;
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
