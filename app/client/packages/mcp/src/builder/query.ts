import { createHash } from "node:crypto";
import { z } from "zod";
import { RAW_EXPRESSION, storedId } from "./schema.js";
import { RESERVED_RESULT_NAMES } from "./sqlReservedWords.js";

// M4 create_query — a STRUCTURED query builder (Security ruling "Option B"). The agent never authors raw SQL or raw
// `{{ }}`. The compiler emits the SQL text AND every binding from validated identifiers, and every value is emitted
// as a `{{ }}` bind parameter (prepared statement), never string-concatenated. This bounds SQL injection (values are
// parameterized, identifiers are allow-listed) and preserves the "agents never author raw expressions" invariant.

// SQL identifier: a table/column/schema name. No quotes, semicolons, whitespace, comment tokens, or brace/`$`.
const SQL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_SQL_IDENTIFIER_LENGTH = 128;
const sqlIdentifier = z
  .string()
  .min(1)
  .max(MAX_SQL_IDENTIFIER_LENGTH)
  .regex(SQL_IDENTIFIER, "must be a plain SQL identifier");

// A qualified name is `table` or `schema.table` — each part a plain identifier.
const MAX_QUALIFIED_NAME_LENGTH = 257;

function hasPlainIdentifierParts(value: string): boolean {
  return value.split(".").every((part) => SQL_IDENTIFIER.test(part));
}

const qualifiedName = z
  .string()
  .min(1)
  .max(MAX_QUALIFIED_NAME_LENGTH)
  .refine(
    hasPlainIdentifierParts,
    "must be table or schema.table (plain identifiers)",
  );

// System catalogs hold the database's own metadata, such as its users and grants, not application data. The compiler
// refuses these schemas on every database, ignoring case:
// - pg_catalog, information_schema, pg_toast and pg_temp*;
// - mysql and performance_schema;
// - sys.
// Some rules need the database, so only the compiler applies them (see refuseSystemCatalog):
// - PostgreSQL: any name part that starts with pg_ (pg_user, for example). Those catalogs are on the search path, so
//   they need no schema.
// - Redshift: the same pg_ rule, and any name part that starts with stl_, stv_, svv_ or svl_ (its system tables and
//   views).
// - Oracle: the SYSTEM schema, ignoring case.
// This is defense in depth, not the trust boundary: the datasource's credentials decide what a query can read. Known
// gaps:
// - SQL Server's sysobjects compatibility views, such as sysobjects and syscolumns without a schema;
// - Oracle's data dictionary views without a schema, such as dba_*, all_* and user_*;
// - a MySQL connection whose default database is mysql.
const SYSTEM_SCHEMAS: ReadonlySet<string> = new Set([
  "pg_catalog",
  "information_schema",
  "pg_toast",
  "mysql",
  "performance_schema",
  "sys",
]);

function isSystemSchema(part: string): boolean {
  const name = part.toLowerCase();

  return SYSTEM_SCHEMAS.has(name) || name.startsWith("pg_temp");
}

// True when a schema part of `table` (every part but the last) is a system schema.
function readsSystemSchema(table: string): boolean {
  return table.split(".").slice(0, -1).some(isSystemSchema);
}

function systemCatalogMessage(table: string): string {
  return `${JSON.stringify(table)} is in a system catalog, which the MCP does not query (a best-effort guard; the datasource's credentials decide what can be read). To see a datasource's tables and columns, call get_datasource_structure`;
}

// The name-part prefixes of each database's system catalogs (see SYSTEM_SCHEMAS).
const SYSTEM_PREFIXES: Partial<Record<SqlDialect, readonly string[]>> = {
  postgres: ["pg_"],
  redshift: ["pg_", "stl_", "stv_", "svv_", "svl_"],
};

// Throws when `table` names a system catalog on this database. `dialect` decides which prefix and schema rules apply.
function refuseSystemCatalog(table: string, dialect: SqlDialect): void {
  const parts = table.split(".").map((part) => part.toLowerCase());
  const prefixes = SYSTEM_PREFIXES[dialect] ?? [];
  const prefixed = parts.some((part) =>
    prefixes.some((prefix) => part.startsWith(prefix)),
  );
  const oracleSystem =
    dialect === "oracle" && parts.slice(0, -1).includes("system");

  if (prefixed || oracleSystem || readsSystemSchema(table)) {
    throw new Error(systemCatalogMessage(table));
  }
}

// A table name: a qualifiedName that is not in a system schema. The pg_ rule needs the database, so compileQuery checks
// it (see refuseSystemCatalog).
const tableNameSchema = qualifiedName.superRefine((table, ctx) => {
  if (hasPlainIdentifierParts(table) && readsSystemSchema(table)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: systemCatalogMessage(table),
    });
  }
});

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
// The object and its rules are separate, so a query with joins can reuse the rules with an alias.column `column`.
const filterObjectSchema = z
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
  .strict();

function refineFilter(
  filter: z.infer<typeof filterObjectSchema>,
  ctx: z.RefinementCtx,
): void {
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
}

const filterSchema = filterObjectSchema.superRefine(refineFilter);

const SKIP_IN_GROUP_MESSAGE =
  "skipWhenEmpty cannot be used inside anyOf: in an OR, a skipped member would match every row";

// An OR group: `{ anyOf: [filter, filter, ...] }` compiles to `(a OR b OR ...)` and is ANDed with the other filters.
// - Members are plain filters, so groups nest one level only.
// - Members cannot use skipWhenEmpty. A skipped filter compiles to TRUE, and inside an OR that makes the whole group
//   TRUE, so one empty control would match every row, even on a SELECT.
function refineFilterGroup(
  group: { anyOf: { skipWhenEmpty?: boolean }[] },
  ctx: z.RefinementCtx,
): void {
  group.anyOf.forEach((member, index) => {
    if (member.skipWhenEmpty === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: SKIP_IN_GROUP_MESSAGE,
        path: ["anyOf", index, "skipWhenEmpty"],
      });
    }
  });
}

const filterGroupSchema = z
  .object({
    anyOf: z.array(filterSchema).min(2).max(10),
  })
  .strict()
  .superRefine(refineFilterGroup);

// One entry of `filters`: a plain filter or an OR group. An own `anyOf` key decides which, so an agent gets the errors
// for the shape it meant instead of a union of both. It returns the parsed entry, not the raw input, so any default or
// transform in either schema applies.
function filterEntrySchemaOf(
  plain: z.ZodType<z.infer<typeof filterSchema>, z.ZodTypeDef, unknown>,
  group: z.ZodType<z.infer<typeof filterGroupSchema>, z.ZodTypeDef, unknown>,
) {
  return z
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
        const result = (isGroup ? group : plain).safeParse(entry);

        if (!result.success) {
          result.error.issues.forEach((issue) => ctx.addIssue(issue));

          return z.NEVER;
        }

        return result.data;
      },
    );
}

const filterEntrySchema = filterEntrySchemaOf(filterSchema, filterGroupSchema);

// The database family the query runs on. `inList` works only on PostgreSQL, which binds a list as one
// prepared-statement parameter (an SQL array). MySQL sends the list as a JSON string, and SQL Server refuses it.
// isNull and notNull compile differently on MySQL (see MYSQL_NULL_TEMPLATES), and Redshift uses the PostgreSQL form
// for them. Redshift is otherwise "other": it cannot bind a list as one parameter, so inList stays refused there.
// Oracle has no LIMIT and folds bare names to upper case, so it gets FETCH FIRST and bare identifiers (see
// quoteIdentifier). Everything else the compiler emits works on every family. An unknown family, such as when the
// caller cannot resolve the datasource, counts as "other".
export type SqlDialect = "postgres" | "redshift" | "mysql" | "oracle" | "other";

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
    case "oracle-plugin":
      return "oracle";
    default:
      return "other";
  }
}

export interface CompileQueryOptions {
  dialect?: SqlDialect;
  // The datasource's plugin package, such as "oracle-plugin". It decides where the action stores its SQL.
  packageName?: string;
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

// The name of a result column that the compiler makes, such as an aggregate's `as` or a bucket's `as`. It is emitted
// bare, like `AS count`, and ORDER BY names it bare too (see emitOrderBy). Each database folds both the same way:
// - PostgreSQL folds them to lower case.
// - MySQL compares these names without case.
// - Oracle and Snowflake fold them to upper case.
// A reserved SQL word would not parse as a bare name, so those are refused (see sqlReservedWords.ts). Oracle needs a
// bare name to start with a letter, so a leading _ is refused too.
const RESULT_NAME = /^[a-z][a-z0-9_]{0,62}$/;
const resultNameSchema = z
  .string()
  .regex(
    RESULT_NAME,
    "must be a lower-case name: a letter, then letters, digits or _, up to 63 characters",
  )
  .refine(
    (name) => !RESERVED_RESULT_NAMES.has(name),
    (name) => ({
      message: `"${name}" is a reserved SQL word; pick another name`,
    }),
  );

// A groupBy column truncated to a date unit: `{ column, bucket: "week", as: "week" }` groups by
// `DATE_TRUNC('week', "column")` and shows it as `week` (PostgreSQL and Redshift only). `as` is required.
// querySpecSchema checks it, so a missing `as` gets its own message instead of a union error.
const BUCKET_UNITS = ["day", "week", "month", "quarter", "year"] as const;
const bucketColumnSchema = z
  .object({
    column: sqlIdentifier,
    bucket: z.enum(BUCKET_UNITS),
    as: resultNameSchema.optional(),
  })
  .strict();

const selectColumnSchema = z.union([
  sqlIdentifier,
  coalesceColumnSchema,
  splitColumnSchema,
  bucketColumnSchema,
]);

type SelectColumn = z.infer<typeof selectColumnSchema>;
type SplitColumn = z.infer<typeof splitColumnSchema>;
type BucketColumn = z.infer<typeof bucketColumnSchema>;

function isSplitColumn(entry: SelectColumn): entry is SplitColumn {
  return typeof entry !== "string" && "split" in entry;
}

function isBucketColumn(entry: SelectColumn): entry is BucketColumn {
  return typeof entry !== "string" && "bucket" in entry;
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
// by a stable, safe name. The single `aggregate` still accepts count, sum and avg only. `aggregates` accepts all five.
const AGGREGATE_FNS = {
  count: "COUNT",
  sum: "SUM",
  avg: "AVG",
  min: "MIN",
  max: "MAX",
} as const;

// How an aggregate's result is rounded, such as FLOOR(AVG(...)). The SQL keyword comes from this map.
const ROUND_FNS = {
  floor: "FLOOR",
  ceil: "CEIL",
  round: "ROUND",
} as const;

// The DATE_TRUNC unit of a bucket. It is emitted as literal SQL text, not as a binding. A bound unit would become a
// different $n parameter in GROUP BY and in the select list, and PostgreSQL would then refuse the select list as not
// grouped.
const DATE_BUCKETS = {
  day: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
} as const;

// Looks up a SQL keyword in one of the closed maps above. Only the map's own keys count, so a name such as
// "constructor" is not found. Throws on a miss, so a caller that skipped parsing never gets other text into the SQL.
function sqlKeyword(
  map: Readonly<Record<string, string>>,
  key: unknown,
  what: string,
): string {
  if (
    typeof key !== "string" ||
    !Object.prototype.hasOwnProperty.call(map, key)
  ) {
    throw new Error(`unknown ${what} ${JSON.stringify(key)}`);
  }

  return map[key];
}

const ABS_ON_COUNT_MESSAGE = "abs is not valid with count";
const ROUND_FN_MESSAGE = "round is only valid with sum or avg";

// One entry of `aggregates`. `column` is required except for count, which then counts rows (COUNT(*)).
// - `abs: true` wraps the input: AVG(ABS("col")). It has no meaning for count.
// - `round` wraps the result: FLOOR(AVG(...)). Only sum and avg can return a fraction.
// - `as` names the result. The default is the fn name.
// The object and its rules are separate, so a query with joins can reuse the rules with an alias.column `column`.
const aggregateObjectSchema = z
  .object({
    fn: z.enum(["count", "sum", "avg", "min", "max"]),
    column: sqlIdentifier.optional(),
    abs: z.boolean().optional(),
    round: z.enum(["floor", "ceil", "round"]).optional(),
    as: resultNameSchema.optional(),
  })
  .strict();

// `case` is the input of an aggregate in a query with `from` (aliasedAggregateSchema). A query on one table has none.
function refineAggregate(
  entry: z.infer<typeof aggregateObjectSchema> & { case?: unknown },
  ctx: z.RefinementCtx,
): void {
  if (
    entry.fn !== "count" &&
    entry.column === undefined &&
    entry.case === undefined
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${entry.fn} needs a column`,
      path: ["column"],
    });
  }

  // abs: false is a no-op, so it is accepted.
  if (entry.fn === "count" && entry.abs === true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ABS_ON_COUNT_MESSAGE,
      path: ["abs"],
    });
  }

  if (entry.round !== undefined && entry.fn !== "sum" && entry.fn !== "avg") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ROUND_FN_MESSAGE,
      path: ["round"],
    });
  }
}

const aggregateEntrySchema = aggregateObjectSchema.superRefine(refineAggregate);

type AggregateEntry = z.infer<typeof aggregateEntrySchema>;

// The name a group key or an aggregate has in the result:
// - a bucket's name is its `as` only. A bucket without `as` has no name, so it returns undefined. querySpecSchema
//   refuses that, and emitResultName throws on it.
// - an aggregate's name is its `as`, or else its fn;
// - any other group key keeps its column's name.
function resultNameOf(
  entry: AggregateEntry | Exclude<SelectColumn, BucketColumn>,
): string;
function resultNameOf(entry: SelectColumn | AggregateEntry): string | undefined;
function resultNameOf(
  entry: SelectColumn | AggregateEntry,
): string | undefined {
  if (typeof entry === "string") return entry;

  if ("fn" in entry) return entry.as ?? entry.fn;

  if (isBucketColumn(entry)) return entry.as;

  return entry.column;
}

// The split source and its item column. A result name of either would be confused with them.
const SPLIT_NAMES = new Set([SPLIT_SOURCE, `${SPLIT_SOURCE}_value`]);

const BOTH_AGGREGATE_FORMS_MESSAGE = "use aggregate or aggregates, not both";

const bucketHavingMessage = (column: string) =>
  `having cannot test a bucket or its column (${column}); filter ${column} in filters instead`;

// The parts of a spec the helpers below read. It is written out, not taken from QuerySpec, so the schema's type does
// not depend on itself.
interface AggregateShape {
  aggregate?: { fn: "count" | "sum" | "avg"; column?: string };
  aggregates?: AggregateEntry[];
  columns?: SelectColumn[];
  groupBy?: SelectColumn[];
  orderBy?: { column: string }[];
}

// The aggregates of a spec as one list. The single `aggregate` becomes a one-entry list, so both forms share the
// checks and the emit path, and the single form compiles exactly as before. querySpecSchema refuses a spec with both,
// and compileQuery throws on one.
function aggregateEntriesOf(spec: AggregateShape): AggregateEntry[] {
  if (spec.aggregates !== undefined) return spec.aggregates;

  if (spec.aggregate !== undefined) {
    return [{ fn: spec.aggregate.fn, column: spec.aggregate.column }];
  }

  return [];
}

// The result names that ORDER BY emits bare: each aggregate's name, from `aggregate` or `aggregates`, and each
// bucket's `as`. Any other orderBy name is a column and stays quoted.
function bareResultNames(spec: AggregateShape): ReadonlySet<string> {
  const buckets = (spec.groupBy ?? []).filter(isBucketColumn);
  const names = [
    ...aggregateEntriesOf(spec).map((entry) => resultNameOf(entry)),
    ...buckets.map((entry) => entry.as),
  ];

  return new Set(names.filter((name): name is string => name !== undefined));
}

// The rules for result names. They run only when `aggregates` or a bucket is present.
// - Each group key and aggregate needs its own result name. The match ignores case, because MySQL and Oracle compare
//   names without case.
// - An `as` cannot be a split source name.
// - orderBy can only name a result. A bucket's source column is not a result, so ordering by it is refused.
function refineResultNames(spec: AggregateShape, ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  const names: string[] = [];
  const check = (
    name: string,
    hasAs: boolean,
    path: (string | number)[],
  ): void => {
    if (hasAs && SPLIT_NAMES.has(name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${name}" is reserved for the split source; pick another name`,
        path,
      });
    }

    if (seen.has(name.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `the result name "${name}" is used more than once (names ignore case); give each aggregate and group key its own name`,
        path,
      });
    }

    seen.add(name.toLowerCase());
    names.push(name);
  };

  (spec.groupBy ?? []).forEach((entry, index) => {
    if (isBucketColumn(entry)) {
      // A bucket without `as` already has its own issue.
      if (entry.as !== undefined) {
        check(entry.as, true, ["groupBy", index, "as"]);
      }
    } else {
      check(resultNameOf(entry), false, ["groupBy", index]);
    }
  });

  if (spec.aggregates !== undefined) {
    spec.aggregates.forEach((entry, index) =>
      check(resultNameOf(entry), entry.as !== undefined, [
        "aggregates",
        index,
        "as",
      ]),
    );
  } else if (spec.aggregate !== undefined) {
    check(spec.aggregate.fn, false, ["aggregate"]);
  }

  (spec.orderBy ?? []).forEach((entry, index) => {
    if (!names.includes(entry.column)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `with aggregates or a bucket, orderBy can only name a result column (${names.map((name) => `"${name}"`).join(", ")})`,
        path: ["orderBy", index, "column"],
      });
    }
  });
}

const DISTINCT_COLUMNS_MESSAGE = "distinct needs a non-empty columns list";

// The most rows a SELECT can ask for.
const MAX_LIMIT = 1000;

// SELECT DISTINCT needs a column list, and works on plain rows only. PostgreSQL refuses ORDER BY on a column that is not
// selected when DISTINCT is set, so orderBy can only name a column in `columns`.
function refineDistinct(spec: AggregateShape, ctx: z.RefinementCtx): void {
  const columns = spec.columns ?? [];

  if (columns.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: DISTINCT_COLUMNS_MESSAGE,
      path: ["distinct"],
    });
  }

  for (const field of ["aggregate", "aggregates", "groupBy"] as const) {
    if (spec[field] !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `distinct cannot be used with ${field}`,
        path: ["distinct"],
      });
    }
  }

  const selected = new Set(columns.map(columnNameOf));

  (spec.orderBy ?? []).forEach((entry, index) => {
    if (!selected.has(entry.column)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "with distinct, orderBy can only name a column in columns",
        path: ["orderBy", index, "column"],
      });
    }
  });
}

// SELECT ordering: each column is an allow-listed identifier; direction is a two-value enum (never interpolated
// raw). Emitted as `ORDER BY "<col>" <DIR>, ...`. A query with joins orders by result names only.
const orderBySchema = z
  .array(
    z
      .object({
        column: sqlIdentifier,
        direction: z.enum(["ASC", "DESC"]),
      })
      .strict(),
  )
  .max(20);

// A query on one table (`table`). querySpecSchema picks this schema, or aliasedSpecSchema for a query with `from`.
const singleTableSpecSchema = z
  .object({
    name: bindingIdentifier,
    // NOTE: no workspaceId — the tool resolves the workspace server-authoritatively from applicationId so a
    // prompt-injected agent cannot bind a datasource from another workspace onto this page (cross-tenant guard).
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
    table: tableNameSchema,
    columns: z.array(selectColumnSchema).max(100).optional(),
    filters: z.array(filterEntrySchema).max(20).optional(),
    values: z
      .array(z.object({ column: sqlIdentifier, value: valueRef }).strict())
      .max(100)
      .optional(),
    orderBy: orderBySchema.optional(),
    // SELECT aggregation over a CLOSED set of functions. `count` may omit the column (COUNT(*)); `sum`/`avg` require a
    // column (enforced in the compiler). Pair with `groupBy` for grouped rollups.
    aggregate: z
      .object({
        fn: z.enum(["count", "sum", "avg"]),
        column: sqlIdentifier.optional(),
      })
      .strict()
      .optional(),
    // More than one aggregate in one SELECT, such as an average and a count. Use this or `aggregate`, not both.
    aggregates: z.array(aggregateEntrySchema).min(1).max(6).optional(),
    // GROUP BY columns for an aggregated SELECT — each an allow-listed identifier, quoted by quoteIdentifier (bare on
    // MySQL).
    groupBy: z.array(selectColumnSchema).max(20).optional(),
    // HAVING conditions on an aggregated SELECT, ANDed together.
    having: z.array(havingConditionSchema).max(10).optional(),
    // SELECT DISTINCT over `columns`. false is a no-op.
    distinct: z.boolean().optional(),
    limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  })
  .strict()
  // orderBy/aggregate/groupBy shape a SELECT only; compileQuery ignores them on INSERT/UPDATE/DELETE. Reject them
  // there so an agent gets clear feedback instead of a silently-dropped clause.
  .superRefine((spec, ctx) => {
    const hasAggregate =
      spec.aggregate !== undefined || spec.aggregates !== undefined;
    const aggregateEntries = aggregateEntriesOf(spec);
    const buckets = (spec.groupBy ?? []).filter(isBucketColumn);
    // The result-name rules below apply only to the new forms, so a spec that uses neither keeps its old behaviour.
    const usesResultNames = spec.aggregates !== undefined || buckets.length > 0;

    if (spec.aggregate !== undefined && spec.aggregates !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: BOTH_AGGREGATE_FORMS_MESSAGE,
        path: ["aggregates"],
      });
    }

    // HAVING filters groups, so it needs an aggregate, and each condition must name an aggregate's result or a group
    // column. A name the select list does not group would fail at run time, or test something the agent did not mean.
    if (spec.having !== undefined) {
      if (!hasAggregate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "having needs an aggregate",
          path: ["having"],
        });
      } else {
        const aggregateNames = aggregateEntries.map(resultNameOf);
        const groupBy = spec.groupBy ?? [];
        const groupColumns = new Set(groupBy.map(columnNameOf));
        const coalescedColumns = new Set(
          groupBy.filter(isCoalesceColumn).map(columnNameOf),
        );

        spec.having.forEach((condition, index) => {
          // A bucket is refused by its result name and by its source column. HAVING on the source column would test
          // the stored value, not the bucket. An aggregate's result name comes first, as in emitHaving, so an
          // aggregate named like a bucket's source column is allowed.
          const bucket = aggregateNames.includes(condition.column)
            ? undefined
            : buckets.find(
                (entry) =>
                  entry.as === condition.column ||
                  entry.column === condition.column,
              );

          if (bucket !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: bucketHavingMessage(bucket.column),
              path: ["having", index, "column"],
            });
          } else if (
            !aggregateNames.includes(condition.column) &&
            !groupColumns.has(condition.column)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `having can only test ${aggregateNames.map((name) => `"${name}"`).join(", ")} or a groupBy column`,
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
    // case-insensitive, so "COUNT" and count are the same name there. With aggregates or a bucket, the result-name
    // rules below check this instead.
    if (spec.aggregate !== undefined && !usesResultNames) {
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

    // A grouped column's coalesce, split or bucket appears in the aggregated select list only. Without an aggregate the
    // select list is `columns` or `*`, so it would be dropped without a word.
    if (!hasAggregate) {
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
        } else if (isBucketColumn(entry)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "bucket on a groupBy column needs an aggregate",
            path: ["groupBy", index, "bucket"],
          });
        }
      });
    } else {
      // With an aggregate, the select list is the group columns and the aggregates only, so a `columns` coalesce would
      // be dropped without a word too. Plain `columns` entries stay ignored, as before. A bucket in columns gets its
      // own message below.
      (spec.columns ?? []).forEach((entry, index) => {
        if (typeof entry !== "string" && !isBucketColumn(entry)) {
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

      (spec.aggregates ?? []).forEach((entry, index) => {
        if (entry.column !== undefined) {
          refuse(entry.column, ["aggregates", index, "column"]);
        }
      });
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

    // A split item or a bucket is a group key. In columns it would have no meaning.
    (spec.columns ?? []).forEach((entry, index) => {
      if (isSplitColumn(entry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "split is only valid in groupBy",
          path: ["columns", index, "split"],
        });
      } else if (isBucketColumn(entry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "bucket is only valid in groupBy",
          path: ["columns", index, "bucket"],
        });
      }
    });

    (spec.groupBy ?? []).forEach((entry, index) => {
      if (isBucketColumn(entry) && entry.as === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'bucket needs as, the name of its result column (such as "week")',
          path: ["groupBy", index, "as"],
        });
      }
    });

    if (usesResultNames) refineResultNames(spec, ctx);

    if (spec.operation === "SELECT" && spec.distinct === true) {
      refineDistinct(spec, ctx);
    }

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
      "aggregates",
      "groupBy",
      "having",
      "distinct",
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

// --- Aliased mode: a SELECT over several tables (`from` and `joins`) ------------------------------------------------
// A query with `from` names each source with an alias, and every column reference is "alias.column". Each output gets
// a bare `AS <result name>`. Only these plugins bind every value as a parameter and are supported (see aliasedDialect).
// Redshift and Snowflake paste values into the SQL text (APP-16507), so they are refused.
const ALIASED_SQL_PACKAGES: ReadonlySet<string> = new Set([
  "postgres-plugin",
  "mysql-plugin",
  "mariadb-plugin",
  "oracle-plugin",
  "mssql-plugin",
]);

const MAX_JOINS = 7;
const MAX_ON_PAIRS = 4;

const ALIASED_MODE_MESSAGE =
  "from and joins need a PostgreSQL, MySQL, MariaDB, Oracle or SQL Server datasource that the server can identify. Redshift and Snowflake are not supported: their plugins put values into the SQL text instead of binding them";
const ALIASED_SELECT_ONLY_MESSAGE =
  "from and joins are only valid on a SELECT query";
const ALIASED_LIMIT_MESSAGE = `limit is required with from and joins (at most ${MAX_LIMIT} rows)`;
const ALIASED_COLUMNS_MESSAGE =
  "with from and joins, list the columns to return in columns (SELECT * is not available)";
const ALIASED_COLUMNS_WITH_AGGREGATES_MESSAGE =
  "with aggregates, put the columns to return in groupBy, not in columns";
const ALIASED_GROUP_BY_MESSAGE = "groupBy needs aggregates";
const ALIASED_SPLIT_MESSAGE = "split is not available with from and joins";
const ON_SIDES_MESSAGE =
  "each on pair compares a column of this join's own alias with a column of a source declared before it";
const BOTH_TABLE_AND_FROM_MESSAGE =
  "use table for a query on one table, or from (with joins) for several, not both";
const SOURCE_TABLE_OR_CTE_MESSAGE = "a source names table or cte, not both";
const CTE_ORDER_AND_LIMIT_MESSAGE =
  "a with query has no orderBy and no limit; order and limit the outer query";
const CASE_NEEDS_FROM_MESSAGE = "a CASE is only available in a query with from";
const AGGREGATE_COLUMN_AND_CASE_MESSAGE =
  "an aggregate takes column or case, not both";

// A column reference in aliased mode: a source alias, a dot, then a plain column name.
const COLUMN_REF = /^([a-z][a-z0-9_]{0,62})\.([A-Za-z_][A-Za-z0-9_]{0,127})$/;
const columnRefSchema = z
  .string()
  .regex(
    COLUMN_REF,
    'must be alias.column, such as "o.status": a source alias from from or joins, a dot, then a plain column name',
  );

// A source alias, such as `o` in `orders o`. It follows the result-name rules, so it is emitted bare. It cannot start
// with mcp_split, the name of the split source.
const aliasSchema = resultNameSchema.refine(
  (name) => !name.startsWith(SPLIT_SOURCE),
  `an alias cannot start with ${SPLIT_SOURCE}`,
);

// A source names a real table or, in a query with `with`, a CTE: exactly one of `table` and `cte`.
function refineTableOrCte(
  source: { table?: string; cte?: string },
  ctx: z.RefinementCtx,
): void {
  if ((source.table === undefined) === (source.cte === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        source.table === undefined
          ? "a source needs table or cte"
          : SOURCE_TABLE_OR_CTE_MESSAGE,
    });
  }
}

const sourceSchema = z
  .object({
    table: tableNameSchema.optional(),
    cte: aliasSchema.optional(),
    as: aliasSchema,
  })
  .strict()
  .superRefine(refineTableOrCte);

// The join keywords. The SQL comes from this map, never from agent text.
const JOIN_TYPES = { inner: "INNER JOIN", left: "LEFT JOIN" } as const;

// One join. `on` is a list of equality pairs, ANDed together.
const joinSchema = z
  .object({
    type: z.enum(["inner", "left"]),
    table: tableNameSchema.optional(),
    cte: aliasSchema.optional(),
    as: aliasSchema,
    on: z
      .array(
        z.object({ left: columnRefSchema, right: columnRefSchema }).strict(),
      )
      .min(1)
      .max(MAX_ON_PAIRS),
  })
  .strict()
  .superRefine(refineTableOrCte);

const aliasedFilterSchema = filterObjectSchema
  .extend({ column: columnRefSchema })
  .superRefine(refineFilter);
const aliasedFilterEntrySchema = filterEntrySchemaOf(
  aliasedFilterSchema,
  z
    .object({ anyOf: z.array(aliasedFilterSchema).min(2).max(10) })
    .strict()
    .superRefine(refineFilterGroup),
);

// --- CASE (aliased mode only) --------------------------------------------------------------------------------------
// `{ case: { when: [{ if: [condition, ...], then }], else? }, as }` compiles to `CASE WHEN ... THEN ... ELSE ... END`.
// The keywords are fixed text. Each condition is a filter, and each then or else is a column or a bound literal.
const MAX_CASE_BRANCHES = 8;
const MAX_CASE_CONDITIONS = 4;
const MAX_CASES_PER_LEVEL = 12;

const CASE_IN_GROUP_BY_MESSAGE =
  "a CASE cannot be in groupBy: compute it in a with query, then group by that query's output";
const NESTED_CASE_MESSAGE = "a CASE cannot contain another CASE";
const CASE_OPERAND_MESSAGE =
  'then and else take { column: "alias.column" } or { literal } (not a widget value)';
const CASE_LITERAL_MESSAGE =
  "a CASE literal must be a string, number or boolean, not null";
const CASE_SKIP_MESSAGE = "a CASE condition cannot use skipWhenEmpty";
const CASE_IN_LIST_MESSAGE = "a CASE condition cannot use inList";
const CASE_CAP_MESSAGE = `a query level can have at most ${MAX_CASES_PER_LEVEL} CASE expressions`;
const BOOLEAN_CASE_MESSAGE =
  "a boolean then or else is not available on Oracle or SQL Server; use a number or a string";

function caseLiteralTypesMessage(first: string, other: string): string {
  return `every literal then and else in one CASE has the same type: the first is a ${first}, this one is a ${other}`;
}

function hasOwn(value: unknown, key: string): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

const caseColumnOperandSchema = z.object({ column: columnRefSchema }).strict();
const caseLiteralOperandSchema = z
  .object({
    literal: literalScalar.refine(
      (value) => value !== null,
      CASE_LITERAL_MESSAGE,
    ),
  })
  .strict();

type CaseOperand =
  | z.infer<typeof caseColumnOperandSchema>
  | z.infer<typeof caseLiteralOperandSchema>;

// One then or else. An own `column` or `literal` key decides which shape it is, so the agent gets the errors for the
// shape it meant.
const caseOperandSchema = z.unknown().transform((entry, ctx): CaseOperand => {
  if (hasOwn(entry, "case")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: NESTED_CASE_MESSAGE });

    return z.NEVER;
  }

  const schema = hasOwn(entry, "column")
    ? caseColumnOperandSchema
    : hasOwn(entry, "literal")
      ? caseLiteralOperandSchema
      : undefined;

  if (schema === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: CASE_OPERAND_MESSAGE,
    });

    return z.NEVER;
  }

  const result = schema.safeParse(entry);

  if (!result.success) {
    result.error.issues.forEach((issue) => ctx.addIssue(issue));

    return z.NEVER;
  }

  return result.data;
});

// A `when` condition: a filter or an anyOf group, without skipWhenEmpty or inList. A skipped condition would turn
// the branch on for every row, and inList needs a widget list.
const caseConditionSchema = aliasedFilterEntrySchema.superRefine(
  (entry, ctx) => {
    const members =
      typeof entry === "object" && entry !== null && isFilterGroup(entry)
        ? entry.anyOf.map((member, index) => ({
            member,
            path: ["anyOf", index] as (string | number)[],
          }))
        : [{ member: entry as Filter, path: [] as (string | number)[] }];

    members.forEach(({ member, path }) => {
      if (typeof member !== "object" || member === null) return;

      if (member.skipWhenEmpty === true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CASE_SKIP_MESSAGE,
          path: [...path, "skipWhenEmpty"],
        });
      }

      if (member.op === "inList") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: CASE_IN_LIST_MESSAGE,
          path: [...path, "op"],
        });
      }
    });
  },
);

// Every literal then and else in one CASE has one JSON type. A CASE returns one SQL type, and a bound literal's type
// comes from its JSON type.
function refineCaseLiterals(
  value: { when: { then: CaseOperand }[]; else?: CaseOperand },
  ctx: z.RefinementCtx,
): void {
  const operands: { operand: CaseOperand; path: (string | number)[] }[] = [
    ...value.when.map((branch, index) => ({
      operand: branch.then,
      path: ["when", index, "then"] as (string | number)[],
    })),
    ...(value.else === undefined
      ? []
      : [{ operand: value.else, path: ["else"] as (string | number)[] }]),
  ];
  let first: string | undefined;

  operands.forEach(({ operand, path }) => {
    if (typeof operand !== "object" || operand === null) return;

    if (!("literal" in operand) || operand.literal === null) return;

    const type = typeof operand.literal;

    if (first === undefined) {
      first = type;
    } else if (type !== first) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: caseLiteralTypesMessage(first, type),
        path: [...path, "literal"],
      });
    }
  });
}

const caseSchema = z
  .object({
    when: z
      .array(
        z
          .object({
            if: z.array(caseConditionSchema).min(1).max(MAX_CASE_CONDITIONS),
            then: caseOperandSchema,
          })
          .strict(),
      )
      .min(1)
      .max(MAX_CASE_BRANCHES),
    else: caseOperandSchema.optional(),
  })
  .strict()
  .superRefine(refineCaseLiterals);

// A `columns` entry that computes a CASE. `as` is required: a CASE has no column name to borrow.
const caseColumnSchema = z
  .object({ case: caseSchema, as: resultNameSchema })
  .strict();

type CaseColumn = z.infer<typeof caseColumnSchema>;

// A select or groupBy entry in aliased mode:
// - "o.status", shown as status (the column part);
// - { column, as }, shown as `as`;
// - { column, coalesce, as? };
// - { column, bucket, as } (groupBy only, PostgreSQL only);
// - { case, as } (columns only).
// The split shape is listed only so that its refusal can name it.
const aliasedPlainSelectSchema = z.union([
  columnRefSchema,
  z.object({ column: columnRefSchema, as: resultNameSchema }).strict(),
  coalesceColumnSchema.extend({
    column: columnRefSchema,
    as: resultNameSchema.optional(),
  }),
  bucketColumnSchema.extend({ column: columnRefSchema }),
  splitColumnSchema.extend({ column: columnRefSchema }),
]);

type AliasedSelect = z.infer<typeof aliasedPlainSelectSchema> | CaseColumn;

// An own `case` key picks the CASE shape, so the agent gets the CASE errors instead of a union of every shape.
const aliasedSelectSchema = z
  .unknown()
  .transform((entry, ctx): AliasedSelect => {
    const result = hasOwn(entry, "case")
      ? caseColumnSchema.safeParse(entry)
      : aliasedPlainSelectSchema.safeParse(entry);

    if (!result.success) {
      result.error.issues.forEach((issue) => ctx.addIssue(issue));

      return z.NEVER;
    }

    return result.data;
  });

// An aggregate in aliased mode. Its input is `column` or `case`, not both. count may have neither (COUNT(*)).
const aliasedAggregateSchema = aggregateObjectSchema
  .extend({
    column: columnRefSchema.optional(),
    case: caseSchema.optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.case !== undefined && entry.column !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: AGGREGATE_COLUMN_AND_CASE_MESSAGE,
        path: ["case"],
      });
    }

    refineAggregate(entry, ctx);
  });

function isAliasedCase(entry: AliasedSelect): entry is CaseColumn {
  return typeof entry !== "string" && "case" in entry;
}

function isAliasedSplit(
  entry: AliasedSelect,
): entry is Extract<AliasedSelect, { split: string }> {
  return typeof entry !== "string" && "split" in entry;
}

function isAliasedBucket(
  entry: AliasedSelect,
): entry is Extract<AliasedSelect, { bucket: string }> {
  return typeof entry !== "string" && "bucket" in entry;
}

function isAliasedCoalesce(
  entry: AliasedSelect,
): entry is Extract<AliasedSelect, { coalesce: unknown }> {
  return typeof entry !== "string" && "coalesce" in entry;
}

function aliasedColumnOf(entry: Exclude<AliasedSelect, CaseColumn>): string {
  return typeof entry === "string" ? entry : entry.column;
}

// The alias and the column of an alias.column reference, or undefined when the value is not one.
function columnRefParts(
  ref: unknown,
): { alias: string; column: string } | undefined {
  if (typeof ref !== "string") return undefined;

  const match = COLUMN_REF.exec(ref);

  return match ? { alias: match[1], column: match[2] } : undefined;
}

// The result name of a select or groupBy entry in aliased mode: its `as`, or else the column part of its reference. A
// bucket has its `as` only, and returns undefined without one.
function aliasedResultName(entry: AliasedSelect): string | undefined {
  if (typeof entry !== "string" && "as" in entry && entry.as !== undefined) {
    return entry.as;
  }

  if (isAliasedBucket(entry) || isAliasedCase(entry)) return undefined;

  return columnRefParts(aliasedColumnOf(entry))?.column;
}

// The parts of an aliased spec that hold column references. It is written out, not taken from AliasedSpec, so the
// schema's type does not depend on itself.
interface AliasedRefShape {
  joins?: { on: { left: string; right: string }[] }[];
  columns?: AliasedSelect[];
  filters?: (Filter | FilterGroup)[];
  groupBy?: AliasedSelect[];
  aggregates?: { column?: string }[];
}

// Every column reference in an aliased spec, with its path: the join conditions, columns, filters (OR-group members
// too), groupBy and aggregate columns. having and orderBy name result names, never a column. Both the schema rules and
// the projection (projectionOf) read this list, so they see the same references. A malformed entry in a spec that
// skipped parsing gives an undefined reference, which the compiler refuses.
function columnRefsOf(
  spec: AliasedRefShape,
): { ref: unknown; path: (string | number)[] }[] {
  const refs: { ref: unknown; path: (string | number)[] }[] = [];
  const objectOrNull = (value: unknown) =>
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : undefined;

  (spec.joins ?? []).forEach((join, index) =>
    (objectOrNull(join)?.on as unknown[] | undefined)?.forEach((pair, p) => {
      refs.push({
        ref: objectOrNull(pair)?.left,
        path: ["joins", index, "on", p, "left"],
      });
      refs.push({
        ref: objectOrNull(pair)?.right,
        path: ["joins", index, "on", p, "right"],
      });
    }),
  );

  // A filter, or an OR group's members.
  const walkFilter = (entry: unknown, path: (string | number)[]) => {
    const group = objectOrNull(entry);

    if (group !== undefined && Array.isArray(group.anyOf)) {
      group.anyOf.forEach((member: unknown, memberIndex: number) =>
        refs.push({
          ref: objectOrNull(member)?.column,
          path: [...path, "anyOf", memberIndex, "column"],
        }),
      );
    } else {
      refs.push({ ref: group?.column, path: [...path, "column"] });
    }
  };
  // A CASE: every `when` condition, and each then or else that reads a column.
  const walkCase = (value: unknown, path: (string | number)[]) => {
    const operand = (entry: unknown, at: (string | number)[]) => {
      const record = objectOrNull(entry);

      if (
        record !== undefined &&
        Object.prototype.hasOwnProperty.call(record, "column")
      ) {
        refs.push({ ref: record.column, path: [...at, "column"] });
      }
    };
    const branches = objectOrNull(value)?.when;

    (Array.isArray(branches) ? branches : []).forEach(
      (branch: unknown, branchIndex: number) => {
        const conditions = objectOrNull(branch)?.if;

        (Array.isArray(conditions) ? conditions : []).forEach(
          (condition: unknown, conditionIndex: number) =>
            walkFilter(condition, [
              ...path,
              "when",
              branchIndex,
              "if",
              conditionIndex,
            ]),
        );
        operand(objectOrNull(branch)?.then, [
          ...path,
          "when",
          branchIndex,
          "then",
        ]);
      },
    );
    operand(objectOrNull(value)?.else, [...path, "else"]);
  };
  const hasCase = (entry: unknown) =>
    Object.prototype.hasOwnProperty.call(objectOrNull(entry) ?? {}, "case");

  for (const field of ["columns", "groupBy"] as const) {
    (spec[field] ?? []).forEach((entry, index) => {
      if (hasCase(entry)) {
        walkCase(objectOrNull(entry)?.case, [field, index, "case"]);

        return;
      }

      refs.push({
        ref: typeof entry === "string" ? entry : objectOrNull(entry)?.column,
        path:
          typeof entry === "string" ? [field, index] : [field, index, "column"],
      });
    });
  }

  (spec.filters ?? []).forEach((entry, index) =>
    walkFilter(entry, ["filters", index]),
  );

  (spec.aggregates ?? []).forEach((entry, index) => {
    const column = objectOrNull(entry)?.column;

    if (column !== undefined) {
      refs.push({ ref: column, path: ["aggregates", index, "column"] });
    }

    if (hasCase(entry)) {
      walkCase(objectOrNull(entry)?.case, ["aggregates", index, "case"]);
    }
  });

  return refs;
}

// The alias scope of a query with `from`. `aliases` lists the from alias, then each join's alias.
// - Each on pair links the new join to a source declared before it: one side uses the join's own alias, the other an
//   earlier alias.
// - Every reference names a declared alias.
// - Every alias is used. A join's own on pair counts as a use.
function refineAliasScope(
  spec: Omit<AliasedRefShape, "joins"> & {
    joins?: { as: string; on: { left: string; right: string }[] }[];
  },
  aliases: string[],
  issue: (path: (string | number)[], message: string) => void,
): void {
  (spec.joins ?? []).forEach((join, index) => {
    const earlier = new Set(aliases.slice(0, index + 1));

    join.on.forEach((pair, pairIndex) => {
      const left = columnRefParts(pair.left)?.alias;
      const right = columnRefParts(pair.right)?.alias;

      // A malformed side already has its own issue.
      if (left === undefined || right === undefined) return;

      const ownLeft = left === join.as;
      const other = ownLeft ? right : left;

      if (ownLeft === (right === join.as) || !earlier.has(other)) {
        issue(
          ["joins", index, "on", pairIndex],
          `${ON_SIDES_MESSAGE} (this join is ${join.as}; earlier sources: ${[...earlier].join(", ")})`,
        );
      }
    });
  });

  const declared = new Set(aliases);
  const used = new Set<string>();

  columnRefsOf(spec).forEach(({ path, ref }) => {
    const parts = columnRefParts(ref);

    if (parts === undefined) return;

    if (!declared.has(parts.alias)) {
      issue(
        path,
        `"${String(ref)}" uses the alias "${parts.alias}", which no source declares (aliases: ${aliases.join(", ")})`,
      );
    }

    used.add(parts.alias);
  });

  aliases.forEach((alias, index) => {
    if (!used.has(alias)) {
      issue(
        index === 0 ? ["from", "as"] : ["joins", index - 1, "as"],
        `the alias "${alias}" is not used; read a column through it or remove the source`,
      );
    }
  });
}

// One query level as refineAliasedLevel reads it: the outer query, or the query of a CTE. A CTE's orderBy and limit
// are read only to refuse them, so they are unknown here.
interface AliasedRefineLevel {
  from: { as: string; table?: string; cte?: string };
  joins?: {
    as: string;
    table?: string;
    cte?: string;
    on: { left: string; right: string }[];
  }[];
  columns?: AliasedSelect[];
  filters?: (Filter | FilterGroup)[];
  groupBy?: AliasedSelect[];
  aggregates?: (AggregateEntry & { case?: unknown })[];
  having?: { column: string }[];
  orderBy?: unknown;
  distinct?: boolean;
  limit?: unknown;
}

type IssueAt = (path: (string | number)[], message: string) => void;

// The result names of a query level: a CTE's outputs. With aggregates they are the group keys and the aggregates;
// without, the columns.
function levelResultNames(level: AliasedRefineLevel): string[] {
  const names =
    level.aggregates !== undefined
      ? [
          ...(level.groupBy ?? []).map(aliasedResultName),
          ...level.aggregates.map((entry) => resultNameOf(entry)),
        ]
      : (level.columns ?? []).map(aliasedResultName);

  return names.filter((name): name is string => name !== undefined);
}

// The from source and each join, with the path of each.
function levelSources(level: AliasedRefineLevel): {
  source: { as: string; table?: string; cte?: string };
  path: (string | number)[];
}[] {
  return [
    { source: level.from, path: ["from"] },
    ...(level.joins ?? []).map((join, index) => ({
      source: join,
      path: ["joins", index] as (string | number)[],
    })),
  ];
}

// The rules for a query with `from`, and its `with` queries. Every check adds an issue and none throws.
// - Each CTE's query follows the level rules, and can read only the CTEs declared before it (no RECURSIVE).
// - CTE names are unique, and every CTE must be read by a later CTE or the outer query.
function refineAliasedSpec(
  spec: AliasedRefineLevel & {
    operation: string;
    with?: { name: string; query: AliasedRefineLevel & { with?: unknown } }[];
  },
  ctx: z.RefinementCtx,
): void {
  const issue: IssueAt = (path, message) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

  if (spec.operation !== "SELECT") {
    issue(["operation"], ALIASED_SELECT_ONLY_MESSAGE);

    return;
  }

  const ctes = spec.with ?? [];
  const cteNames = ctes.map((cte) => cte.name);
  const scope = new Map<string, string[]>();

  ctes.forEach((cte, index) => {
    const issueIn: IssueAt = (path, message) =>
      issue(["with", index, "query", ...path], message);

    if (
      cteNames
        .slice(0, index)
        .some((name) => name.toLowerCase() === cte.name.toLowerCase())
    ) {
      issue(
        ["with", index, "name"],
        `the with query name "${cte.name}" is used more than once`,
      );
    }

    if (cte.query.with !== undefined) issueIn(["with"], NESTED_WITH_MESSAGE);

    refineAliasedLevel(cte.query, issueIn, "cte", scope, cteNames);

    if (!scope.has(cte.name)) {
      scope.set(cte.name, levelResultNames(cte.query));
    }
  });

  refineAliasedLevel(spec, issue, "outer", scope, cteNames);

  const read = new Set(
    [spec, ...ctes.map((cte) => cte.query)].flatMap((level) =>
      levelSources(level).flatMap(({ source }) =>
        source.cte === undefined ? [] : [source.cte],
      ),
    ),
  );

  // A name that breaks the name rules already has its own issue.
  ctes.forEach((cte, index) => {
    if (aliasSchema.safeParse(cte.name).success && !read.has(cte.name)) {
      issue(
        ["with", index, "name"],
        `the with query ${cte.name} is not used; read it with from or a join { cte, as }`,
      );
    }
  });
}

// The rules for one query level with `from`. `kind` says which level it is: the outer query needs a limit, and a
// CTE's query has no orderBy and no limit. `scope` holds the CTEs the level can read, and `cteNames` every CTE name.
function refineAliasedLevel(
  spec: AliasedRefineLevel,
  issue: IssueAt,
  kind: "outer" | "cte",
  scope: CteScope,
  cteNames: readonly string[],
): void {
  const isCteName = (name: string) =>
    cteNames.some((cte) => cte.toLowerCase() === name.toLowerCase());

  // A source reads a CTE in scope, or a table that a CTE name does not shadow. An alias is never a CTE name.
  levelSources(spec).forEach(({ path, source }) => {
    // A cte name that breaks the name rules already has its own issue.
    if (
      source.cte !== undefined &&
      aliasSchema.safeParse(source.cte).success &&
      !scope.has(source.cte)
    ) {
      issue(
        [...path, "cte"],
        `"${source.cte}" is not a with query declared before this query; a with query can read only the ones declared before it`,
      );
    }

    if (
      source.table !== undefined &&
      !source.table.includes(".") &&
      isCteName(source.table)
    ) {
      issue(
        [...path, "table"],
        `"${source.table}" is also the name of a with query: use { cte: "${source.table}" } to read the with query, or schema.table to read the table`,
      );
    }

    if (isCteName(source.as)) {
      issue(
        [...path, "as"],
        `the alias "${source.as}" is also the name of a with query; pick another alias`,
      );
    }
  });

  const joins = spec.joins ?? [];
  const aliases = [spec.from.as, ...joins.map((join) => join.as)];
  const aliasPath = (index: number) =>
    index === 0 ? ["from", "as"] : ["joins", index - 1, "as"];
  const seenAliases = new Set<string>();

  aliases.forEach((alias, index) => {
    if (seenAliases.has(alias.toLowerCase())) {
      issue(
        aliasPath(index),
        `the alias "${alias}" is used more than once (aliases ignore case); give each source its own alias`,
      );
    }

    seenAliases.add(alias.toLowerCase());
  });

  // An alias that breaks its own rule already has an issue. The scope checks would repeat it for every reference, so
  // they are skipped.
  if (aliases.every((alias) => aliasSchema.safeParse(alias).success)) {
    refineAliasScope(spec, aliases, issue);

    // A reference through a CTE's alias must name one of the CTE's outputs.
    // A source with both table and cte, or a CTE with no outputs, already has its own issue.
    const cteOfAlias = new Map(
      levelSources(spec).flatMap(({ source }) =>
        source.cte !== undefined &&
        source.table === undefined &&
        scope.has(source.cte)
          ? [[source.as, source.cte] as const]
          : [],
      ),
    );

    columnRefsOf(spec).forEach(({ path, ref }) => {
      const parts = columnRefParts(ref);
      const cte = parts === undefined ? undefined : cteOfAlias.get(parts.alias);

      if (parts === undefined || cte === undefined) return;

      const outputs = scope.get(cte) ?? [];

      if (outputs.length > 0 && !outputs.includes(parts.column)) {
        issue(
          path,
          `${notCteOutputMessage(parts.alias, parts.column, cte)} (outputs: ${outputs.join(", ")})`,
        );
      }
    });
  }

  if (kind === "outer" && spec.limit === undefined) {
    issue(["limit"], ALIASED_LIMIT_MESSAGE);
  }

  if (kind === "cte") {
    for (const field of ["orderBy", "limit"] as const) {
      if (spec[field] !== undefined) {
        issue([field], CTE_ORDER_AND_LIMIT_MESSAGE);
      }
    }
  }

  const aggregates = spec.aggregates;

  if (aggregates === undefined) {
    if (spec.columns === undefined || spec.columns.length === 0) {
      issue(["columns"], ALIASED_COLUMNS_MESSAGE);
    }

    if (spec.groupBy !== undefined) {
      issue(["groupBy"], ALIASED_GROUP_BY_MESSAGE);
    }

    if (spec.having !== undefined)
      issue(["having"], "having needs an aggregate");
  } else {
    if (spec.columns !== undefined) {
      issue(["columns"], ALIASED_COLUMNS_WITH_AGGREGATES_MESSAGE);
    }

    if (spec.distinct === true) {
      issue(["distinct"], "distinct cannot be used with aggregates");
    }
  }

  // Result names: each output's name is checked like an `as`, and all are unique ignoring case. A name taken from a
  // column part may not fit the rules, so it then needs an `as`.
  const names: string[] = [];
  const checkName = (
    name: string | undefined,
    path: (string | number)[],
    fromColumn: boolean,
  ) => {
    if (name === undefined) return;

    if (
      fromColumn &&
      (!RESULT_NAME.test(name) || RESERVED_RESULT_NAMES.has(name))
    ) {
      issue(
        path,
        `the column name "${name}" cannot be a result name as it is; add as with a lower-case name that is not a SQL keyword`,
      );
    }

    if (SPLIT_NAMES.has(name)) {
      issue(
        path,
        `"${name}" is reserved for the split source; pick another name`,
      );
    }

    if (names.some((seen) => seen.toLowerCase() === name.toLowerCase())) {
      issue(
        path,
        `the result name "${name}" is used more than once (names ignore case); give each output its own name with as`,
      );
    }

    names.push(name);
  };
  const outputField = aggregates === undefined ? "columns" : "groupBy";
  let caseCount = 0;
  // Counts a CASE, and refuses the one past the cap.
  const countCase = (path: (string | number)[]) => {
    caseCount += 1;

    if (caseCount > MAX_CASES_PER_LEVEL) issue(path, CASE_CAP_MESSAGE);
  };

  for (const field of ["columns", "groupBy"] as const) {
    (spec[field] ?? []).forEach((entry, index) => {
      if (isAliasedCase(entry)) {
        if (field === "groupBy") {
          issue([field, index, "case"], CASE_IN_GROUP_BY_MESSAGE);

          return;
        }

        countCase([field, index, "case"]);
      }

      if (isAliasedSplit(entry)) {
        issue([field, index, "split"], ALIASED_SPLIT_MESSAGE);

        return;
      }

      if (isAliasedBucket(entry)) {
        if (field === "columns") {
          issue([field, index, "bucket"], "bucket is only valid in groupBy");

          return;
        }

        if (entry.as === undefined) {
          issue(
            [field, index, "as"],
            'bucket needs as, the name of its result column (such as "week")',
          );

          return;
        }
      }

      if (field !== outputField) return;

      const hasAs = typeof entry !== "string" && entry.as !== undefined;

      checkName(
        aliasedResultName(entry),
        hasAs
          ? [field, index, "as"]
          : typeof entry === "string"
            ? [field, index]
            : [field, index, "column"],
        !hasAs,
      );
    });
  }

  (aggregates ?? []).forEach((entry, index) => {
    if (entry.case !== undefined) countCase(["aggregates", index, "case"]);

    checkName(resultNameOf(entry), ["aggregates", index, "as"], false);
  });

  // having names an aggregate's result, or a groupBy result name that is not a bucket or a coalesce.
  if (spec.having !== undefined && aggregates !== undefined) {
    const aggregateNames = aggregates.map((entry) => resultNameOf(entry));

    spec.having.forEach((condition, index) => {
      if (aggregateNames.includes(condition.column)) return;

      const group = (spec.groupBy ?? []).find(
        (entry) => aliasedResultName(entry) === condition.column,
      );
      const path = ["having", index, "column"];

      if (group === undefined) {
        issue(
          path,
          `having can only test an aggregate's result name (${aggregateNames.map((name) => `"${name}"`).join(", ")}) or a groupBy result name`,
        );
      } else if (isAliasedBucket(group)) {
        issue(
          path,
          "having cannot test a bucket; filter its column in filters instead",
        );
      } else if (isAliasedCoalesce(group)) {
        issue(
          path,
          "having cannot test a groupBy column that has coalesce (it would test the stored value, not the fallback shown)",
        );
      }
    });
  }

  // A CTE's orderBy is refused above, so only the outer query's is read here.
  if (kind === "outer") {
    ((spec.orderBy ?? []) as { column: string }[]).forEach((entry, index) => {
      if (!names.includes(entry.column)) {
        issue(
          ["orderBy", index, "column"],
          `with from and joins, orderBy can only name a result name (${names.map((name) => `"${name}"`).join(", ")})`,
        );
      }
    });
  }
}

// --- WITH (aliased mode only) -----------------------------------------------------------------------------------------
// `with: [{ name, query }]` compiles to `WITH name AS (SELECT ...), ... SELECT ...`. Depth 1, no RECURSIVE. A CTE's
// query is a SELECT core: no orderBy, no limit and no `with` of its own. Those keys are listed only so that their
// refusal can name them.
const MAX_CTES = 4;

const NESTED_WITH_MESSAGE =
  "with queries cannot be nested; list every with query in the outer with";
const WITH_ON_MYSQL_MESSAGE =
  "with is not available on MySQL or MariaDB: their plugin returns rows only for a query whose first word is SELECT";

const cteQuerySchema = z
  .object({
    from: sourceSchema,
    joins: z.array(joinSchema).max(MAX_JOINS).optional(),
    columns: z.array(aliasedSelectSchema).max(100).optional(),
    filters: z.array(aliasedFilterEntrySchema).max(20).optional(),
    aggregates: z.array(aliasedAggregateSchema).min(1).max(6).optional(),
    groupBy: z.array(aliasedSelectSchema).max(20).optional(),
    having: z.array(havingConditionSchema).max(10).optional(),
    distinct: z.boolean().optional(),
    orderBy: z.unknown().optional(),
    limit: z.unknown().optional(),
    with: z.unknown().optional(),
  })
  .strict();

const withSchema = z
  .array(z.object({ name: aliasSchema, query: cteQuerySchema }).strict())
  .min(1)
  .max(MAX_CTES);

// A SELECT over several tables. querySpecSchema picks it when the spec has `from`, `joins` or `with`.
const aliasedSpecSchema = z
  .object({
    name: bindingIdentifier,
    applicationId: storedId,
    pageId: storedId,
    datasourceId: storedId,
    operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
    with: withSchema.optional(),
    from: sourceSchema,
    joins: z.array(joinSchema).max(MAX_JOINS).optional(),
    columns: z.array(aliasedSelectSchema).max(100).optional(),
    filters: z.array(aliasedFilterEntrySchema).max(20).optional(),
    orderBy: orderBySchema.optional(),
    aggregates: z.array(aliasedAggregateSchema).min(1).max(6).optional(),
    groupBy: z.array(aliasedSelectSchema).max(20).optional(),
    having: z.array(havingConditionSchema).max(10).optional(),
    distinct: z.boolean().optional(),
    limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
  })
  .strict()
  .superRefine(refineAliasedSpec);

type SingleTableSpec = z.infer<typeof singleTableSpecSchema>;
type AliasedSpec = z.infer<typeof aliasedSpecSchema>;

function hasOwnValue(value: object, key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(value, key) &&
    (value as Record<string, unknown>)[key] !== undefined
  );
}

// A spec with `from`, `joins` or `with` is in aliased mode. Anything else is a query on one table, parsed exactly as
// before. It returns the parsed spec, so each schema's own rules apply, and passes on each issue with its own path.
export const querySpecSchema = z
  .unknown()
  .transform((input, ctx): SingleTableSpec | AliasedSpec => {
    const aliased =
      typeof input === "object" &&
      input !== null &&
      (hasOwnValue(input, "from") ||
        hasOwnValue(input, "joins") ||
        hasOwnValue(input, "with"));

    if (aliased && hasOwnValue(input, "table")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: BOTH_TABLE_AND_FROM_MESSAGE,
        path: ["table"],
      });

      return z.NEVER;
    }

    const result = aliased
      ? aliasedSpecSchema.safeParse(input)
      : singleTableSpecSchema.safeParse(input);

    if (!result.success) {
      result.error.issues.forEach((issue) => ctx.addIssue(issue));

      return z.NEVER;
    }

    return result.data;
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

// Writes each brace in a JSON-encoded literal as a \u escape. Appsmith finds bindings by counting single braces, and
// it does not skip quoted text. So `{{ "{" }} AND b = {{ "}" }}` would read as one binding, and `AND b =` would drop
// out of the SQL. The escape gives the same string when the binding is evaluated.
function escapeBraces(json: string): string {
  return json.replace(/\{/g, "\\u007b").replace(/\}/g, "\\u007d");
}

// Emit a value as a `{{ }}` bind parameter. A literal is JSON-encoded, and a widget reference is a validated
// identifier path. Either way the braces are compiler-authored and the inner content cannot break out.
function emitBinding(value: ValueRef): string {
  // literalScalar already refuses template syntax. Check again so that a caller that skipped parsing cannot nest a
  // binding inside a string literal, which SAFE_BINDING and the brace count both accept.
  if (
    "literal" in value &&
    typeof value.literal === "string" &&
    RAW_EXPRESSION.test(value.literal)
  ) {
    throw new Error("unsafe literal value");
  }

  const binding =
    "literal" in value
      ? `{{ ${escapeBraces(JSON.stringify(value.literal))} }}`
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

// On PostgreSQL and Redshift, throws when a quoted column name equals the table's own name (the last part of
// `schema.table`), because a missing column of that name reads as the whole row. `quoted` is the name exactly as it
// goes between the double quotes. The table is emitted bare, so it is compared lower-cased:
// - PostgreSQL keeps a quoted name's case, so "Tickets" cannot read as the row `tickets`.
// - Redshift folds quoted names to lower case by default, so it compares lower-cased.
// Both compare after the database's own cut, so two long names that differ only after it still match. `usage` names
// the clause in the error, such as "a filter cannot test".
function refuseTableNamedColumn(
  quoted: string,
  table: string,
  dialect: SqlDialect,
  usage: string,
): void {
  if (dialect !== "postgres" && dialect !== "redshift") return;

  const name = dialect === "redshift" ? quoted.toLowerCase() : quoted;
  const tableName = (table.split(".").pop() ?? table).toLowerCase();
  const maxLength = MAX_IDENTIFIER_LENGTH[dialect];

  if (name.slice(0, maxLength) === tableName.slice(0, maxLength)) {
    throw new Error(
      `${usage} a column named like its table (${quoted}) on PostgreSQL or Redshift, which would read it as the whole row`,
    );
  }
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
  columns: ColumnResolver,
): string {
  // An allow-listed identifier can still be a keyword, such as `null` or `current_user`. A bare `null IS NULL` is true
  // for every row, and so is `current_user = 'app'` when the value is the database user. Either would widen a DELETE
  // to the whole table. So no filter emits its column bare (ColumnResolver.filterColumn):
  // - PostgreSQL: lower-cased and quoted. Lower-casing gives the same column an unquoted value filter names, because
  //   PostgreSQL folds unquoted names to lower case. Not `table.col`: when no such column exists, PostgreSQL reads
  //   `users.text` as the call `text(users)`, which is never NULL. A missing quoted column is an error, except a
  //   name equal to the table's, which PostgreSQL reads as the whole row. That name is refused.
  // - Redshift: the PostgreSQL form. Redshift derives from PostgreSQL, so `table.col` could have the same
  //   function-call reading. A quoted bare name cannot.
  // - Every other database: qualified with its table. After a dot, MySQL always reads a column name. SQL Server,
  //   Oracle and Snowflake read a column or refuse the query.
  const column = columns.filterColumn(filter.column);

  // The null-test SQL comes from NULL_OPERATORS or MYSQL_NULL_TEMPLATES. No agent text and no binding.
  if (isNullOperator(filter.op)) {
    return dialect === "postgres" || dialect === "redshift"
      ? `${column} ${NULL_OPERATORS[filter.op]}`
      : emitQualifiedNullCheck(filter.op, column, dialect);
  }

  if (filter.op === "inList") {
    if (dialect !== "postgres") {
      throw new Error(
        `inList (filter on ${filter.column}) is only available on a PostgreSQL datasource, which binds a list as one query parameter; on other databases use one eq filter per control (with skipWhenEmpty) or a single-select`,
      );
    }

    // CAST both sides to text. A select holds string option values, and this lets them match both text and numeric
    // columns. The list binds as one SQL array parameter. A null list (an empty selection) matches nothing.
    return `CAST(${column} AS TEXT) = ANY(CAST(${emitNullWhenEmpty(widgetRef(filter))} AS TEXT[]))`;
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
    return `${column} ${sqlKeyword(OPERATORS, filter.op, "filter op")} ${emitWildcardBinding(filterValue(filter), filter.match)}`;
  }

  // On PostgreSQL, a skipWhenEmpty filter binds null while the widget value is empty. "" against a typed column (an
  // integer column, for example) fails to prepare, even though the guard short-circuits.
  // On other databases, the empty value binds as-is: MySQL and SQL Server coerce "", and Oracle treats "" as NULL.
  // This avoids an untyped NULL parameter, which some JDBC drivers (Oracle's) reject.
  const binding =
    filter.skipWhenEmpty === true && dialect === "postgres"
      ? emitNullWhenEmpty(widgetRef(filter))
      : emitBinding(filterValue(filter));

  if (filter.op === "in") return `${column} IN (${binding})`;

  return `${column} ${sqlKeyword(OPERATORS, filter.op, "filter op")} ${binding}`;
}

// Quote an allow-listed column identifier for the dialect. MySQL and MariaDB read "col" as a string unless the
// server runs with ANSI_QUOTES, which groups and sorts by a constant. Backtick quoting is not an option:
// assertBodySafe refuses any backtick in a body. So MySQL gets the bare identifier, as plain select columns already
// do. The identifier charset admits no quote or backslash, so a bare name cannot break out. A column named after a
// reserved word then fails with a syntax error instead of returning wrong results.
// Oracle also gets bare names: a quoted name is case-sensitive there, so "status" would not match a STATUS column
// created without quotes, which is how most Oracle columns are made.
// The schema already allows only plain identifiers of up to 128 characters. This checks again, on every dialect, so
// that a caller that skipped parsing cannot put other text into the SQL.
function quoteIdentifier(name: string, dialect: SqlDialect): string {
  if (
    typeof name !== "string" ||
    name.length > MAX_SQL_IDENTIFIER_LENGTH ||
    !SQL_IDENTIFIER.test(name)
  ) {
    throw new Error(`unsafe identifier: ${JSON.stringify(name)}`);
  }

  return dialect === "mysql" || dialect === "oracle" ? name : `"${name}"`;
}

// The table name, checked again with the qualifiedName rule. querySpecSchema already checks it. This stops a caller
// that skipped parsing from putting other text, or `undefined`, into FROM, INSERT INTO, UPDATE or DELETE FROM.
function checkedTableName(table: unknown): string {
  if (
    typeof table !== "string" ||
    table.length === 0 ||
    table.length > MAX_QUALIFIED_NAME_LENGTH ||
    !hasPlainIdentifierParts(table)
  ) {
    throw new Error(`unsafe table name: ${JSON.stringify(table)}`);
  }

  return table;
}

// A column name, checked again with the sqlIdentifier rule. querySpecSchema already checks it. This is for the names a
// resolver writes without quoteIdentifier, which checks its own. It stops a caller that skipped parsing from putting
// other text into the SQL.
function checkedColumnName(column: unknown): string {
  if (
    typeof column !== "string" ||
    column.length > MAX_SQL_IDENTIFIER_LENGTH ||
    !SQL_IDENTIFIER.test(column)
  ) {
    throw new Error(`unsafe column name: ${JSON.stringify(column)}`);
  }

  return column;
}

// How the emitters write the table and its columns. Each clause has its own method, because each clause writes a
// column its own way. The emitters take a resolver instead of the table name, so another query shape can pass its own
// resolver without a change to the emitters. A resolver writes names only. Values still go through emitBinding, and
// keywords through sqlKeyword.
interface ColumnResolver {
  // The table, as FROM, INSERT INTO, UPDATE and DELETE FROM write it.
  readonly table: string;
  // The column a WHERE condition tests.
  filterColumn(column: string): string;
  // A column in the plain select list, with no aggregate.
  selectColumn(column: string): string;
  // The name a select item shows a coalesced or split column under. `grouped` is true in the aggregated select list.
  columnAlias(column: string, grouped: boolean): string;
  // A group key column. GROUP BY, HAVING and a bucket's DATE_TRUNC use it.
  groupColumn(column: string): string;
  // The column inside an aggregate call.
  aggregateColumn(column: string): string;
  // An orderBy column that is not a result name.
  orderColumn(column: string): string;
  // The column a split reads in FROM.
  splitColumn(column: string): string;
  // The column an INSERT or UPDATE writes.
  writeColumn(column: string): string;
  // Throws when the column would read the whole row (see refuseTableNamedColumn).
  refuseRowRead(column: string, usage: string): void;
  // A CASE expression, as an aggregate's input. Only a query with `from` has one.
  caseExpression(value: unknown): string;
}

// The resolver for a query on one table. It writes each clause as the compiler always has:
// - filters: never bare (see emitCondition). On PostgreSQL and Redshift, lower-cased and quoted. Everywhere else,
//   `table.col`.
// - the plain select list, write columns and a non-grouped alias: bare.
// - group keys, aggregate columns, orderBy and a grouped alias: through quoteIdentifier.
// - the split column: quoted.
// Every name is checked again before it is written: by quoteIdentifier, or else by checkedColumnName.
// On PostgreSQL and Redshift a column named like its table can read as the whole row. Filters and group keys refuse
// it. For filters this matters because:
// - a null test or inList's CAST to text can match rows;
// - the plugin binds text values untyped, so `"users" = $1` or `"users" < $1` compares the row with a row literal the
//   value spells out.
function singleTableColumns(
  table: unknown,
  dialect: SqlDialect,
): ColumnResolver {
  const checkedTable = checkedTableName(table);

  refuseSystemCatalog(checkedTable, dialect);

  const refuseRowRead = (column: string, usage: string) =>
    refuseTableNamedColumn(column, checkedTable, dialect, usage);

  return {
    table: checkedTable,
    filterColumn(column) {
      const name = checkedColumnName(column);

      if (dialect !== "postgres" && dialect !== "redshift") {
        return `${checkedTable}.${name}`;
      }

      refuseRowRead(name.toLowerCase(), "a filter cannot test");

      return `"${name.toLowerCase()}"`;
    },
    selectColumn: (column) => checkedColumnName(column),
    columnAlias: (column, grouped) =>
      grouped ? quoteIdentifier(column, dialect) : checkedColumnName(column),
    groupColumn(column) {
      refuseRowRead(column, "groupBy and having cannot use");

      return quoteIdentifier(column, dialect);
    },
    aggregateColumn: (column) => quoteIdentifier(column, dialect),
    orderColumn: (column) => quoteIdentifier(column, dialect),
    splitColumn: (column) => `"${checkedColumnName(column)}"`,
    writeColumn: (column) => checkedColumnName(column),
    refuseRowRead,
    caseExpression: () => {
      throw new Error(CASE_NEEDS_FROM_MESSAGE);
    },
  };
}

// The orderBy directions. The SQL keyword comes from this map.
const ORDER_DIRECTIONS = { ASC: "ASC", DESC: "DESC" } as const;

// Emit `ORDER BY "col" ASC, "col2" DESC` (bare names on MySQL, see quoteIdentifier). Direction comes from
// ORDER_DIRECTIONS, never agent text. A name in `bareNames` is an aggregate or bucket result name. It is emitted bare,
// like its `AS` alias, so both fold the same way. A quoted "n" would miss the alias n on Snowflake, which folds it to N.
function emitOrderBy(
  orderBy: QuerySpec["orderBy"],
  columns: ColumnResolver,
  bareNames: ReadonlySet<string>,
): string {
  if (!orderBy || orderBy.length === 0) return "";

  const clauses = orderBy.map((entry) => {
    const name = bareNames.has(entry.column)
      ? emitResultName(entry.column)
      : columns.orderColumn(entry.column);

    return `${name} ${sqlKeyword(ORDER_DIRECTIONS, entry.direction, "orderBy direction")}`;
  });

  return ` ORDER BY ${clauses.join(", ")}`;
}

// Emit `GROUP BY "col", "col2"`. Same allow-listed identifiers, quoted by quoteIdentifier (bare on MySQL).
function emitGroupBy(
  groupBy: SingleTableSpec["groupBy"],
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (!groupBy || groupBy.length === 0) return "";

  // Group by the stored column, even when the select list coalesces it. NULLs form their own group, and the select
  // list then shows that group under the fallback.
  const clauses = groupBy.map((entry) =>
    groupKeyExpression(entry, dialect, columns),
  );

  return ` GROUP BY ${clauses.join(", ")}`;
}

// The SQL a group key compiles to, shared by GROUP BY, HAVING and the aggregated select list, so all three name the
// same thing. A split column's key is the trimmed item from the lateral split source. A bucket's key is its
// DATE_TRUNC call (see bucketExpression). Every other column's key is its stored name, quoted by quoteIdentifier
// (bare on MySQL). On PostgreSQL and Redshift a group column named like the table would group by, or test, the whole
// row, so it is refused.
function groupKeyExpression(
  entry: SelectColumn,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (isSplitColumn(entry)) return SPLIT_ITEM;

  if (isBucketColumn(entry)) return bucketExpression(entry, dialect, columns);

  return columns.groupColumn(columnNameOf(entry));
}

// A bucket's group key, such as `DATE_TRUNC('week', "created_at")`. GROUP BY repeats this call and never uses the
// alias, because PostgreSQL reads a GROUP BY name as an input column first. Only PostgreSQL and Redshift are
// supported. The unit comes from DATE_BUCKETS, and the column is refused when it is named like the table.
function bucketExpression(
  entry: BucketColumn,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (dialect !== "postgres" && dialect !== "redshift") {
    throw new Error(
      `bucket (on ${entry.column}) is only available on a PostgreSQL or Redshift datasource, which have DATE_TRUNC`,
    );
  }

  const unit = sqlKeyword(DATE_BUCKETS, entry.bucket, "bucket");

  return `DATE_TRUNC('${unit}', ${columns.groupColumn(entry.column)})`;
}

// A result name, emitted bare. querySpecSchema already checks it. This checks again so that a caller that skipped
// parsing cannot put other text into the SQL.
function emitResultName(name: string | undefined): string {
  if (
    name === undefined ||
    !RESULT_NAME.test(name) ||
    RESERVED_RESULT_NAMES.has(name) ||
    SPLIT_NAMES.has(name)
  ) {
    throw new Error(`invalid result name: ${JSON.stringify(name)}`);
  }

  return name;
}

// One select-list item. `quote` matches the list's own style: plain columns are emitted bare, group columns quoted.
// - A coalesce entry keeps the column's name as its alias, and its fallback is a bound parameter.
// - A split entry shows its item under the column's name.
// - A bucket shows its DATE_TRUNC call under its `as`.
function emitSelectColumn(
  entry: SelectColumn,
  quote: boolean,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (isSplitColumn(entry)) {
    if (!quote) {
      throw new Error("split is only valid in groupBy");
    }

    return `${SPLIT_ITEM} AS ${columns.columnAlias(entry.column, true)}`;
  }

  if (isBucketColumn(entry)) {
    if (!quote) {
      throw new Error("bucket is only valid in groupBy");
    }

    return `${groupKeyExpression(entry, dialect, columns)} AS ${emitResultName(entry.as)}`;
  }

  const name = quote
    ? groupKeyExpression(entry, dialect, columns)
    : columns.selectColumn(columnNameOf(entry));

  if (typeof entry === "string") return name;

  return `COALESCE(${name}, ${emitBinding(entry.coalesce)}) AS ${columns.columnAlias(entry.column, quote)}`;
}

// The FROM clause: the table, plus the lateral split source when a group column uses split (PostgreSQL only). The
// separator is a bound parameter, and the source and item names are fixed text. The resolver checked the table name
// again when it was made (see checkedTableName).
function emitFrom(
  spec: SingleTableSpec,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  const split = (spec.groupBy ?? []).find(isSplitColumn);

  if (split === undefined) return columns.table;

  if (dialect !== "postgres") {
    throw new Error(
      `split (on ${split.column}) is only available on a PostgreSQL datasource, which can unnest an array`,
    );
  }

  return `${columns.table} CROSS JOIN LATERAL unnest(string_to_array(${columns.splitColumn(split.column)}, ${emitBinding({ literal: split.split })})) AS ${SPLIT_SOURCE}(mcp_split_value)`;
}

// Emit one aggregate select item, e.g. `COUNT(*) AS count`, `SUM("amount") AS sum`, `FLOOR(AVG(ABS("x"))) AS avg`.
// The single `aggregate` and each `aggregates` entry both use it. The alias is the entry's result name, emitted bare.
function emitAggregate(
  entry: AggregateEntry,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  return `${aggregateExpression(entry, dialect, columns)} AS ${emitResultName(resultNameOf(entry))}`;
}

// The aggregate call without its alias, such as `COUNT(*)`, `SUM("amount")` or `FLOOR(AVG(ABS("x")))`. HAVING repeats
// it, because PostgreSQL does not accept a select-list alias there. Every keyword comes from AGGREGATE_FNS or
// ROUND_FNS, and the column is an allow-listed identifier quoted by quoteIdentifier (bare on MySQL). Only count can
// omit the column. abs and round are checked again here, so a caller that skipped parsing fails closed.
// A query with `from` can use a CASE as the input instead of a column (see ColumnResolver.caseExpression). The
// single-table resolver refuses a CASE, so a query on one table compiles exactly as before.
function aggregateExpression(
  entry: AggregateEntry & { case?: unknown },
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  const fn = sqlKeyword(AGGREGATE_FNS, entry.fn, "aggregate fn");

  if (entry.case !== undefined && entry.column !== undefined) {
    throw new Error(AGGREGATE_COLUMN_AND_CASE_MESSAGE);
  }

  if (entry.fn === "count") {
    if (entry.abs === true) throw new Error(ABS_ON_COUNT_MESSAGE);

    if (entry.round !== undefined) throw new Error(ROUND_FN_MESSAGE);

    let target = "*";

    if (entry.column) {
      target = columns.aggregateColumn(entry.column);
    } else if (entry.case !== undefined) {
      target = columns.caseExpression(entry.case);
    }

    return `${fn}(${target})`;
  }

  if (!entry.column && entry.case === undefined) {
    throw new Error(`${entry.fn} aggregation requires a column`);
  }

  const column = entry.column
    ? columns.aggregateColumn(entry.column)
    : columns.caseExpression(entry.case);
  const call = `${fn}(${entry.abs === true ? `ABS(${column})` : column})`;

  if (entry.round === undefined) return call;

  if (entry.fn !== "sum" && entry.fn !== "avg") {
    throw new Error(ROUND_FN_MESSAGE);
  }

  // SQL Server spells ceil as CEILING, and its ROUND needs a second argument. "other" covers SQL Server, so ceil and
  // round are refused there. FLOOR works on every database.
  if (
    dialect === "other" &&
    (entry.round === "ceil" || entry.round === "round")
  ) {
    throw new Error(
      `round "${entry.round}" (on ${entry.column ?? "a CASE"}) is only available on a PostgreSQL, Redshift, MySQL or Oracle datasource; on other databases use round "floor" or no round`,
    );
  }

  return `${sqlKeyword(ROUND_FNS, entry.round, "round")}(${call})`;
}

// Emit `HAVING <cond> AND ...`. Each condition tests an aggregate (the entry whose result name matches, its
// expression repeated) or a group column (its stored name, quoted as GROUP BY quotes it). Values are bound parameters,
// and the operator comes from HAVING_OPERATORS.
function emitHaving(
  spec: SingleTableSpec,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (!spec.having || spec.having.length === 0) return "";

  const aggregates = aggregateEntriesOf(spec);

  if (aggregates.length === 0) {
    throw new Error("having needs an aggregate");
  }

  const conditions = spec.having.map((condition) => {
    const aggregate = aggregates.find(
      (entry) => resultNameOf(entry) === condition.column,
    );
    const groupEntry = (spec.groupBy ?? []).find(
      (entry) =>
        columnNameOf(entry) === condition.column ||
        resultNameOf(entry) === condition.column,
    );

    // querySpecSchema refuses this. Check again so that a caller that skipped parsing fails closed.
    if (
      aggregate === undefined &&
      groupEntry !== undefined &&
      isBucketColumn(groupEntry)
    ) {
      throw new Error(bucketHavingMessage(groupEntry.column));
    }

    const target =
      aggregate !== undefined
        ? aggregateExpression(aggregate, dialect, columns)
        : groupKeyExpression(groupEntry ?? condition.column, dialect, columns);

    return `${target} ${sqlKeyword(HAVING_OPERATORS, condition.op, "having op")} ${emitBinding(condition.value)}`;
  });

  return ` HAVING ${conditions.join(" AND ")}`;
}

function emitWhere(
  filters: SingleTableSpec["filters"],
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (!filters || filters.length === 0) return "";

  const clauses = filters.map((entry) => {
    if (!isFilterGroup(entry)) return emitFilter(entry, dialect, columns);

    const members = entry.anyOf.map((member) => {
      // filterGroupSchema refuses this. Check again so that a caller that skipped parsing fails closed, instead of
      // emitting a skip guard that makes the whole OR group TRUE.
      if (member.skipWhenEmpty === true) {
        throw new Error(SKIP_IN_GROUP_MESSAGE);
      }

      return emitCondition(member, dialect, columns);
    });

    return `(${members.join(" OR ")})`;
  });

  return ` WHERE ${clauses.join(" AND ")}`;
}

// One plain filter, wrapped in its empty guard when it has skipWhenEmpty.
function emitFilter(
  filter: Filter,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  const condition = emitCondition(filter, dialect, columns);

  if (filter.skipWhenEmpty !== true) return condition;

  return `(${emitEmptyGuard(widgetRef(filter))} = 1 OR ${condition})`;
}

// The row limit. Oracle (12c and later) has no LIMIT; FETCH FIRST is its row limit. querySpecSchema already allows only
// an integer from 1 to MAX_LIMIT. This checks again so that a caller that skipped parsing cannot put other text into
// the SQL or lift the cap.
function emitLimit(limit: unknown, dialect: SqlDialect): string {
  if (limit === undefined) return "";

  const rows = checkedLimit(limit);

  return dialect === "oracle"
    ? ` FETCH FIRST ${rows} ROWS ONLY`
    : ` LIMIT ${rows}`;
}

function checkedLimit(limit: unknown): number {
  if (
    typeof limit !== "number" ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    throw new Error(
      `limit must be an integer from 1 to ${MAX_LIMIT}: ${JSON.stringify(limit)}`,
    );
  }

  return limit;
}

// --- Aliased mode: compile a SELECT over several tables ---------------------------------------------------------------

// The database family of a query with `from`. The plugin must be in ALIASED_SQL_PACKAGES, and the dialect must be the
// one that plugin maps to, so a caller cannot pair a supported dialect with another plugin. A caller that cannot name
// the plugin (packageName undefined) is refused too.
function aliasedDialect(options: CompileQueryOptions): SqlDialect {
  const { dialect, packageName } = options;

  if (
    typeof packageName !== "string" ||
    !ALIASED_SQL_PACKAGES.has(packageName) ||
    dialect !== sqlDialectFor(packageName)
  ) {
    throw new Error(ALIASED_MODE_MESSAGE);
  }

  return dialect;
}

// A source alias, checked again with the aliasSchema rules.
function checkedAlias(alias: unknown): string {
  if (
    typeof alias !== "string" ||
    !RESULT_NAME.test(alias) ||
    RESERVED_RESULT_NAMES.has(alias) ||
    alias.startsWith(SPLIT_SOURCE)
  ) {
    throw new Error(`unsafe alias: ${JSON.stringify(alias)}`);
  }

  return alias;
}

// An alias.column reference, checked again with the columnRefSchema rule.
function checkedColumnRef(ref: unknown): { alias: string; column: string } {
  const parts = columnRefParts(ref);

  if (parts === undefined) {
    throw new Error(`unsafe column reference: ${JSON.stringify(ref)}`);
  }

  return parts;
}

// A source table, checked again: a qualifiedName that is not a system catalog.
function checkedSourceTable(table: unknown, dialect: SqlDialect): string {
  const checked = checkedTableName(table);

  refuseSystemCatalog(checked, dialect);

  return checked;
}

// The CTEs a query level can read: each name with its output names, in declaration order. A level can read only the
// CTEs declared before it, so each level gets its own scope.
type CteScope = ReadonlyMap<string, readonly string[]>;

const NO_CTES: CteScope = new Map();

// One source of a query level: a real table, or a CTE declared in `with`.
type AliasedSource = {
  alias: string;
  // The join type (a JOIN_TYPES key). The first source has none.
  type?: string;
  on: { left: string; right: string }[];
} & ({ kind: "table"; table: string } | { kind: "cte"; cte: string });

// One query level with `from`: the outer query, or the query of a CTE. A CTE has no orderBy and no limit.
interface AliasedLevel {
  from: unknown;
  joins?: { on: { left: string; right: string }[] }[];
  columns?: AliasedSelect[];
  filters?: (Filter | FilterGroup)[];
  groupBy?: AliasedSelect[];
  aggregates?: (AggregateEntry & { case?: unknown })[];
  having?: { column: string; op: string; value: ValueRef }[];
  orderBy?: { column: string; direction: "ASC" | "DESC" }[];
  distinct?: boolean;
  limit?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return (typeof value === "object" && value !== null ? value : {}) as Record<
    string,
    unknown
  >;
}

// A CTE name, checked again: the alias rules, and declared in `scope`.
function checkedCteName(name: unknown, scope: CteScope): string {
  const checked = checkedAlias(name);

  if (!scope.has(checked)) {
    throw new Error(
      `no with query declared before this one is named ${JSON.stringify(checked)}`,
    );
  }

  return checked;
}

// One source, checked again: a table that is not a system catalog, or a CTE in scope. A single-part table name equal
// to any CTE name (ignoring case) is refused, because the database would read the CTE instead.
function checkedSource(
  value: Record<string, unknown>,
  dialect: SqlDialect,
  scope: CteScope,
  cteNames: readonly string[],
): { kind: "table"; table: string } | { kind: "cte"; cte: string } {
  if (Object.prototype.hasOwnProperty.call(value, "cte")) {
    if (Object.prototype.hasOwnProperty.call(value, "table")) {
      throw new Error(SOURCE_TABLE_OR_CTE_MESSAGE);
    }

    return { kind: "cte", cte: checkedCteName(value.cte, scope) };
  }

  const table = checkedSourceTable(value.table, dialect);

  if (
    !table.includes(".") &&
    cteNames.some((name) => name.toLowerCase() === table.toLowerCase())
  ) {
    throw new Error(
      `"${table}" is also the name of a with query; read the table as schema.table`,
    );
  }

  return { kind: "table", table };
}

// An alias, checked again: the alias rules, and not a CTE name (ignoring case).
function checkedLevelAlias(
  alias: unknown,
  cteNames: readonly string[],
): string {
  const checked = checkedAlias(alias);

  if (cteNames.some((name) => name.toLowerCase() === checked.toLowerCase())) {
    throw new Error(`the alias "${checked}" is also the name of a with query`);
  }

  return checked;
}

// The sources of a query level, checked again: every alias, table or CTE, join type and on pair. One side of each on
// pair uses the join's own alias, and the other an alias declared before it.
function checkedSources(
  level: AliasedLevel,
  dialect: SqlDialect,
  scope: CteScope,
  cteNames: readonly string[],
): AliasedSource[] {
  const from = asRecord(level.from);
  const joins: unknown = level.joins ?? [];

  if (!Array.isArray(joins) || joins.length > MAX_JOINS) {
    throw new Error(`joins must be a list of at most ${MAX_JOINS} joins`);
  }

  const sources: AliasedSource[] = [
    {
      alias: checkedLevelAlias(from.as, cteNames),
      on: [],
      ...checkedSource(from, dialect, scope, cteNames),
    },
  ];
  const declared = new Set([sources[0].alias]);

  joins.forEach((value: unknown) => {
    const join = asRecord(value);
    const alias = checkedLevelAlias(join.as, cteNames);

    if (declared.has(alias)) {
      throw new Error(`the alias "${alias}" is used more than once`);
    }

    // Throws on a type that is not a JOIN_TYPES key, such as "left outer" or "constructor".
    sqlKeyword(JOIN_TYPES, join.type, "join type");

    const on: unknown = join.on;

    if (!Array.isArray(on) || on.length < 1 || on.length > MAX_ON_PAIRS) {
      throw new Error(`a join needs 1 to ${MAX_ON_PAIRS} on pairs`);
    }

    const pairs = on.map((pairValue: unknown) => {
      const pair = asRecord(pairValue);
      const left = checkedColumnRef(pair.left);
      const right = checkedColumnRef(pair.right);
      const ownLeft = left.alias === alias;
      const other = ownLeft ? right.alias : left.alias;

      if (ownLeft === (right.alias === alias) || !declared.has(other)) {
        throw new Error(ON_SIDES_MESSAGE);
      }

      return {
        left: `${left.alias}.${left.column}`,
        right: `${right.alias}.${right.column}`,
      };
    });

    declared.add(alias);
    sources.push({
      alias,
      type: join.type as string,
      on: pairs,
      ...checkedSource(join, dialect, scope, cteNames),
    });
  });

  return sources;
}

// The one name normalizer for a projected column. The projection, the inner column list and the outer reference all
// use it, so the inner list and the outer reference always name the same column.
// - PostgreSQL: the name exactly as written. It is quoted, so "o.createdAt" reads the column createdAt, and "o.Status"
//   and "o.status" are two columns.
// - Redshift: lower-cased, because Redshift folds quoted names to lower case by default.
// - Every other database: the name as written. Only the projection check uses it there.
function projectedName(column: string, dialect: SqlDialect): string {
  const name = checkedColumnName(column);

  return dialect === "redshift" ? name.toLowerCase() : name;
}

function notCteOutputMessage(alias: string, column: string, cte: string) {
  return `"${alias}.${column}" is not an output of the with query ${cte}`;
}

// What a query level reads through each alias, built from the spec before anything is emitted.
// - A table alias: each alias.column reference adds its column once, in the order the spec first names it.
// - A CTE alias: the CTE's declared outputs. Every reference must name one of them.
// Every source must be read at least once.
function projectionOf(
  level: AliasedLevel,
  sources: AliasedSource[],
  dialect: SqlDialect,
  scope: CteScope,
): Map<string, string[]> {
  const projection = new Map<string, string[]>();
  const cteOf = new Map<string, string>();
  const used = new Set<string>();

  for (const source of sources) {
    if (source.kind === "cte") {
      projection.set(source.alias, [...(scope.get(source.cte) ?? [])]);
      cteOf.set(source.alias, source.cte);
    } else {
      projection.set(source.alias, []);
    }
  }

  for (const { ref } of columnRefsOf(level)) {
    const { alias, column } = checkedColumnRef(ref);
    const names = projection.get(alias);

    if (names === undefined) {
      throw new Error(
        `"${alias}.${column}" uses an alias that no source declares`,
      );
    }

    used.add(alias);

    const cte = cteOf.get(alias);

    if (cte !== undefined) {
      if (!names.includes(column)) {
        throw new Error(notCteOutputMessage(alias, column, cte));
      }

      continue;
    }

    const name = projectedName(column, dialect);

    if (!names.includes(name)) names.push(name);
  }

  for (const [alias, names] of projection) {
    if (names.length === 0 || !used.has(alias)) {
      throw new Error(`the alias "${alias}" is not used`);
    }
  }

  return projection;
}

// The resolver for a query level with `from`.
// - A table column is "alias.column", written alias."col" (bare on MySQL and Oracle, see quoteIdentifier; on
//   PostgreSQL and Redshift the name comes from projectedName). Before it writes one, it checks that the column is in
//   the alias's projection. So a reference that the projection missed never reaches the SQL. On PostgreSQL this keeps
//   alias."col" a column: for a missing column, PostgreSQL reads `alias.name` as the call name(alias).
// - A CTE column is written bare, alias.name, as the CTE's own `AS name` is. It must be one of the CTE's outputs.
function aliasedColumns(
  sources: AliasedSource[],
  projection: ReadonlyMap<string, readonly string[]>,
  dialect: SqlDialect,
): ColumnResolver {
  const cteOf = new Map(
    sources.flatMap((source) =>
      source.kind === "cte" ? [[source.alias, source.cte] as const] : [],
    ),
  );
  const reference = (ref: string): string => {
    const { alias, column } = checkedColumnRef(ref);
    const cte = cteOf.get(alias);

    if (cte !== undefined) {
      if (projection.get(alias)?.includes(column) !== true) {
        throw new Error(notCteOutputMessage(alias, column, cte));
      }

      return `${alias}.${emitResultName(column)}`;
    }

    const name = projectedName(column, dialect);

    if (projection.get(alias)?.includes(name) !== true) {
      throw new Error(
        `"${alias}.${column}" is not a column this query reads through ${alias}`,
      );
    }

    return dialect === "postgres" || dialect === "redshift"
      ? `${alias}."${name}"`
      : `${alias}.${quoteIdentifier(column, dialect)}`;
  };
  const unavailable = (what: string) => (): never => {
    throw new Error(`${what} is not available with from and joins`);
  };
  const resolver: ColumnResolver = {
    get table(): string {
      throw new Error("a query with from and joins has no single table");
    },
    filterColumn: reference,
    selectColumn: reference,
    columnAlias: unavailable("a column alias"),
    groupColumn: reference,
    aggregateColumn: reference,
    orderColumn: reference,
    splitColumn: unavailable("split"),
    writeColumn: unavailable("a write"),
    // The closed projection already refuses a column named like its table (see emitAliasedSource).
    refuseRowRead: () => undefined,
    caseExpression: (value) => emitCaseExpression(value, dialect, resolver),
  };

  return resolver;
}

// One `when` condition of a CASE: a filter, or an OR group in parentheses. skipWhenEmpty and inList are refused, as
// caseConditionSchema refuses them.
function emitCaseCondition(
  value: unknown,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (typeof value !== "object" || value === null) {
    throw new Error(`unsafe CASE condition: ${JSON.stringify(value)}`);
  }

  const condition = (filter: Filter) => {
    if (filter.skipWhenEmpty === true) throw new Error(CASE_SKIP_MESSAGE);

    if (filter.op === "inList") throw new Error(CASE_IN_LIST_MESSAGE);

    return emitCondition(filter, dialect, columns);
  };
  const entry = value as Filter | FilterGroup;

  if (isFilterGroup(entry)) {
    return `(${entry.anyOf.map(condition).join(" OR ")})`;
  }

  return condition(entry);
}

// `CASE WHEN <conditions> THEN <operand> ... ELSE <operand> END`. The keywords are fixed text. A then or else is a
// column, through the resolver's projection check, or a literal, bound with emitBinding. Every literal in one CASE has
// one JSON type, and none is null. A boolean literal is refused on Oracle and SQL Server, which have no boolean
// expression type to return. Each rule is checked again here, so a caller that skipped parsing fails closed.
function emitCaseExpression(
  value: unknown,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  const record = asRecord(value);
  const branches = record.when;

  if (
    !Array.isArray(branches) ||
    branches.length < 1 ||
    branches.length > MAX_CASE_BRANCHES
  ) {
    throw new Error(`a CASE needs 1 to ${MAX_CASE_BRANCHES} when branches`);
  }

  let literalType: string | undefined;
  const operand = (entry: unknown): string => {
    if (hasOwn(entry, "case")) throw new Error(NESTED_CASE_MESSAGE);

    const operandRecord = asRecord(entry);
    const isColumn = hasOwn(entry, "column");
    const isLiteral = hasOwn(entry, "literal");

    if (isColumn === isLiteral || Object.keys(operandRecord).length !== 1) {
      throw new Error(CASE_OPERAND_MESSAGE);
    }

    if (isColumn) return columns.selectColumn(operandRecord.column as string);

    const literal = operandRecord.literal;

    if (
      typeof literal !== "string" &&
      typeof literal !== "number" &&
      typeof literal !== "boolean"
    ) {
      throw new Error(CASE_LITERAL_MESSAGE);
    }

    if (
      typeof literal === "boolean" &&
      (dialect === "oracle" || dialect === "other")
    ) {
      throw new Error(BOOLEAN_CASE_MESSAGE);
    }

    if (literalType === undefined) {
      literalType = typeof literal;
    } else if (literalType !== typeof literal) {
      throw new Error(caseLiteralTypesMessage(literalType, typeof literal));
    }

    return emitBinding({ literal });
  };
  const whens = branches.map((branchValue: unknown) => {
    const branch = asRecord(branchValue);
    const conditions = branch.if;

    if (
      !Array.isArray(conditions) ||
      conditions.length < 1 ||
      conditions.length > MAX_CASE_CONDITIONS
    ) {
      throw new Error(
        `a CASE branch needs 1 to ${MAX_CASE_CONDITIONS} if conditions`,
      );
    }

    const test = conditions
      .map((condition: unknown) =>
        emitCaseCondition(condition, dialect, columns),
      )
      .join(" AND ");

    return `WHEN ${test} THEN ${operand(branch.then)}`;
  });
  const elseText =
    record.else === undefined ? "" : ` ELSE ${operand(record.else)}`;

  return `CASE ${whens.join(" ")}${elseText} END`;
}

// One source in FROM or a join, without its join keyword.
// - A CTE: `name alias`. It needs no projection: its outputs are its declared result names, and every reference to
//   them is checked against that list (see aliasedColumns).
// - A table on PostgreSQL and Redshift: a closed projection, `(SELECT "c1", "c2" FROM schema.t) o`, which lists
//   exactly the columns the spec reads through `o`. Inside it only one table is in scope, so a missing column is an
//   error, not a function call. The inner FROM has no alias, so only the table's own name can read as the whole row,
//   and refuseTableNamedColumn refuses it.
// - A table on every other database: `schema.t o`.
// No database gets AS before the alias: Oracle does not accept it.
function emitAliasedSource(
  source: AliasedSource,
  projection: ReadonlyMap<string, readonly string[]>,
  dialect: SqlDialect,
  scope: CteScope,
): string {
  const alias = checkedAlias(source.alias);

  if (source.kind === "cte") {
    return `${checkedCteName(source.cte, scope)} ${alias}`;
  }

  const table = checkedSourceTable(source.table, dialect);

  if (dialect !== "postgres" && dialect !== "redshift") {
    return `${table} ${alias}`;
  }

  const names = projection.get(alias) ?? [];

  if (names.length === 0) {
    throw new Error(`the alias "${alias}" is not used`);
  }

  const list = names
    .map((name) => {
      const checked = projectedName(name, dialect);

      refuseTableNamedColumn(
        checked,
        table,
        dialect,
        "a query with from and joins cannot read",
      );

      return `"${checked}"`;
    })
    .join(", ");

  return `(SELECT ${list} FROM ${table}) ${alias}`;
}

// FROM and its joins: `<source> INNER JOIN <source> ON a."x" = b."y" AND ...`. It checks the plugin again (see
// aliasedDialect). The join keyword comes from JOIN_TYPES and the operator is a fixed `=`.
function emitAliasedFrom(
  sources: AliasedSource[],
  projection: ReadonlyMap<string, readonly string[]>,
  columns: ColumnResolver,
  options: CompileQueryOptions,
  scope: CteScope,
): string {
  const dialect = aliasedDialect(options);

  return sources
    .map((source, index) => {
      const text = emitAliasedSource(source, projection, dialect, scope);

      if (index === 0) return text;

      const on = source.on
        .map(
          (pair) =>
            `${columns.filterColumn(pair.left)} = ${columns.filterColumn(pair.right)}`,
        )
        .join(" AND ");

      return `${sqlKeyword(JOIN_TYPES, source.type, "join type")} ${text} ON ${on}`;
    })
    .join(" ");
}

// A group key in aliased mode: a bucket's DATE_TRUNC call, or else the referenced column.
function aliasedGroupKey(
  entry: AliasedSelect,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (isAliasedSplit(entry)) throw new Error(ALIASED_SPLIT_MESSAGE);

  if (isAliasedCase(entry)) throw new Error(CASE_IN_GROUP_BY_MESSAGE);

  if (isAliasedBucket(entry)) return bucketExpression(entry, dialect, columns);

  return columns.groupColumn(aliasedColumnOf(entry));
}

// One output in aliased mode, always with a bare `AS <result name>`: the column, its COALESCE, a bucket (groupBy
// only) or a CASE (columns only).
function emitAliasedOutput(
  entry: AliasedSelect,
  grouped: boolean,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (isAliasedBucket(entry) && !grouped) {
    throw new Error("bucket is only valid in groupBy");
  }

  if (isAliasedCase(entry) && !grouped) {
    return `${columns.caseExpression(entry.case)} AS ${emitResultName(entry.as)}`;
  }

  const expression = aliasedGroupKey(entry, dialect, columns);
  const name = emitResultName(aliasedResultName(entry));

  if (isAliasedCoalesce(entry)) {
    return `COALESCE(${expression}, ${emitBinding(entry.coalesce)}) AS ${name}`;
  }

  return `${expression} AS ${name}`;
}

// HAVING in aliased mode. Each condition names an aggregate's result (its expression is repeated) or a plain groupBy
// result name (its column is repeated). Values are bound, and the operator comes from HAVING_OPERATORS.
function emitAliasedHaving(
  spec: AliasedLevel,
  dialect: SqlDialect,
  columns: ColumnResolver,
): string {
  if (!spec.having || spec.having.length === 0) return "";

  const aggregates = spec.aggregates ?? [];

  if (aggregates.length === 0) throw new Error("having needs an aggregate");

  const conditions = spec.having.map((condition) => {
    const aggregate = aggregates.find(
      (entry) => resultNameOf(entry) === condition.column,
    );
    const group = (spec.groupBy ?? []).find(
      (entry) => aliasedResultName(entry) === condition.column,
    );
    let target: string;

    if (aggregate !== undefined) {
      target = aggregateExpression(aggregate, dialect, columns);
    } else if (
      group !== undefined &&
      !isAliasedBucket(group) &&
      !isAliasedCoalesce(group)
    ) {
      target = aliasedGroupKey(group, dialect, columns);
    } else {
      throw new Error(
        `having can only test an aggregate's result name or a plain groupBy result name: ${JSON.stringify(condition.column)}`,
      );
    }

    return `${target} ${sqlKeyword(HAVING_OPERATORS, condition.op, "having op")} ${emitBinding(condition.value)}`;
  });

  return ` HAVING ${conditions.join(" AND ")}`;
}

// Compile one query level with `from`, without a trailing semicolon. `kind` says which level it is:
// - "outer": the query itself. limit is required. SQL Server has no LIMIT, so the row cap there is `SELECT TOP (n)`.
// - "cte": the query of a CTE. It has no orderBy and no limit.
// `scope` holds the CTEs this level can read, and `cteNames` every CTE name. It returns the SQL, the level's result
// names (a CTE's outputs) and the CTEs it reads. querySpecSchema already checks each rule below. They run again so that
// a caller that skipped parsing fails closed.
function compileAliasedLevel(
  spec: AliasedLevel,
  kind: "outer" | "cte",
  options: CompileQueryOptions,
  scope: CteScope,
  cteNames: readonly string[] = [],
): { sql: string; outputs: string[]; reads: string[] } {
  const dialect = aliasedDialect(options);
  let rows: number | undefined;

  if (kind === "outer") {
    if (spec.limit === undefined) throw new Error(ALIASED_LIMIT_MESSAGE);

    rows = checkedLimit(spec.limit);
  } else if (spec.limit !== undefined || spec.orderBy !== undefined) {
    throw new Error(CTE_ORDER_AND_LIMIT_MESSAGE);
  }

  const sources = checkedSources(spec, dialect, scope, cteNames);
  const projection = projectionOf(spec, sources, dialect, scope);
  const columns = aliasedColumns(sources, projection, dialect);
  const aggregates = spec.aggregates ?? [];
  const caseCount =
    (spec.columns ?? []).filter(isAliasedCase).length +
    aggregates.filter((entry) => entry.case !== undefined).length;

  if (caseCount > MAX_CASES_PER_LEVEL) throw new Error(CASE_CAP_MESSAGE);

  const groupBy = spec.groupBy ?? [];
  let outputs: string[];
  let names: (string | undefined)[];

  if (aggregates.length > 0) {
    if (spec.columns !== undefined) {
      throw new Error(ALIASED_COLUMNS_WITH_AGGREGATES_MESSAGE);
    }

    if (spec.distinct === true) {
      throw new Error("distinct cannot be used with aggregates");
    }

    outputs = [
      ...groupBy.map((entry) =>
        emitAliasedOutput(entry, true, dialect, columns),
      ),
      ...aggregates.map((entry) => emitAggregate(entry, dialect, columns)),
    ];
    names = [
      ...groupBy.map(aliasedResultName),
      ...aggregates.map((entry) => resultNameOf(entry)),
    ];
  } else {
    if (!spec.columns || spec.columns.length === 0) {
      throw new Error(ALIASED_COLUMNS_MESSAGE);
    }

    if (spec.groupBy !== undefined) throw new Error(ALIASED_GROUP_BY_MESSAGE);

    if (spec.having !== undefined) throw new Error("having needs an aggregate");

    outputs = spec.columns.map((entry) =>
      emitAliasedOutput(entry, false, dialect, columns),
    );
    names = spec.columns.map(aliasedResultName);
  }

  // Result names are unique, ignoring case. orderBy emits them bare (see emitOrderBy).
  const resultNames = new Set<string>();
  const seenNames = new Set<string>();

  for (const name of names) {
    const checked = emitResultName(name);

    if (seenNames.has(checked.toLowerCase())) {
      throw new Error(`the result name "${checked}" is used more than once`);
    }

    seenNames.add(checked.toLowerCase());
    resultNames.add(checked);
  }

  const mssqlTop = rows !== undefined && options.packageName === "mssql-plugin";
  const top = mssqlTop ? `TOP (${rows}) ` : "";
  const limit = rows !== undefined && !mssqlTop ? emitLimit(rows, dialect) : "";
  const distinct = spec.distinct === true ? "DISTINCT " : "";
  const groupByClause =
    aggregates.length > 0 && groupBy.length > 0
      ? ` GROUP BY ${groupBy.map((entry) => aliasedGroupKey(entry, dialect, columns)).join(", ")}`
      : "";

  return {
    sql: `SELECT ${distinct}${top}${outputs.join(", ")} FROM ${emitAliasedFrom(sources, projection, columns, options, scope)}${emitWhere(spec.filters, dialect, columns)}${groupByClause}${emitAliasedHaving(spec, dialect, columns)}${emitOrderBy(spec.orderBy, columns, resultNames)}${limit}`,
    outputs: [...resultNames],
    reads: sources.flatMap((source) =>
      source.kind === "cte" ? [source.cte] : [],
    ),
  };
}

// Compile a query with `from`: checks the plugin, compiles each CTE in order with the CTEs before it in scope, then the
// outer level. Every CTE must be read. WITH is refused on MySQL and MariaDB (see WITH_ON_MYSQL_MESSAGE).
function compileAliasedSelect(
  spec: AliasedSpec,
  options: CompileQueryOptions,
): string {
  const dialect = aliasedDialect(options);

  if (hasOwnValue(spec, "table")) throw new Error(BOTH_TABLE_AND_FROM_MESSAGE);

  if (spec.operation !== "SELECT") throw new Error(ALIASED_SELECT_ONLY_MESSAGE);

  const ctes: unknown = spec.with;

  if (ctes === undefined) {
    return `${compileAliasedLevel(spec, "outer", options, NO_CTES).sql};`;
  }

  if (dialect === "mysql") throw new Error(WITH_ON_MYSQL_MESSAGE);

  if (!Array.isArray(ctes) || ctes.length < 1 || ctes.length > MAX_CTES) {
    throw new Error(`with needs 1 to ${MAX_CTES} queries`);
  }

  const cteNames = ctes.map((cte: unknown) => checkedAlias(asRecord(cte).name));
  const scope = new Map<string, readonly string[]>();
  const read = new Set<string>();
  const parts = ctes.map((value: unknown, index: number) => {
    const cte = asRecord(value);
    const name = cteNames[index];

    if (
      cteNames
        .slice(0, index)
        .some((earlier) => earlier.toLowerCase() === name.toLowerCase())
    ) {
      throw new Error(`the with query name "${name}" is used more than once`);
    }

    const query = asRecord(cte.query);

    if (query.with !== undefined) throw new Error(NESTED_WITH_MESSAGE);

    const level = compileAliasedLevel(
      query as unknown as AliasedLevel,
      "cte",
      options,
      scope,
      cteNames,
    );

    level.reads.forEach((cteName) => read.add(cteName));
    scope.set(name, level.outputs);

    return `${name} AS (${level.sql})`;
  });
  const outer = compileAliasedLevel(spec, "outer", options, scope, cteNames);

  outer.reads.forEach((cteName) => read.add(cteName));

  for (const name of cteNames) {
    if (!read.has(name)) {
      throw new Error(`the with query ${name} is not used`);
    }
  }

  return `WITH ${parts.join(", ")} ${outer.sql};`;
}

function isAliasedSpec(spec: QuerySpec): spec is AliasedSpec {
  return (
    hasOwnValue(spec, "from") ||
    hasOwnValue(spec, "joins") ||
    hasOwnValue(spec, "with")
  );
}

// Compile a structured spec into a parameterized SQL body. Throws on an empty/oversized body or if the emitted body
// somehow contains a brace pair that isn't a compiler-emitted binding (fail-closed defense-in-depth).
// A spec with `from`, `joins` or `with` compiles in aliased mode (compileAliasedSelect). Every other spec compiles as
// a query on one table.
export function compileQuery(
  spec: QuerySpec,
  options: CompileQueryOptions = {},
): string {
  if (isAliasedSpec(spec)) {
    const aliasedBody = compileAliasedSelect(spec, options);

    assertBodySafe(aliasedBody);

    return aliasedBody;
  }

  const dialect = options.dialect ?? "other";
  // Throws on a missing or unsafe table name (see checkedTableName).
  const columns = singleTableColumns(spec.table, dialect);
  let body: string;

  switch (spec.operation) {
    case "SELECT": {
      // Aggregated SELECT: the group-by columns (quoted) followed by the aggregate items, e.g.
      // `SELECT "region", SUM("amount") AS sum`. Otherwise the plain column list (unquoted, matching the
      // existing convention) or `*`.
      // querySpecSchema refuses each check below. They run again so that a caller that skipped parsing fails closed.
      if (spec.aggregate !== undefined && spec.aggregates !== undefined) {
        throw new Error(BOTH_AGGREGATE_FORMS_MESSAGE);
      }

      const aggregates = aggregateEntriesOf(spec);

      if (spec.distinct === true) {
        if (aggregates.length > 0 || spec.groupBy !== undefined) {
          throw new Error(
            "distinct cannot be used with aggregate, aggregates or groupBy",
          );
        }

        if (!spec.columns || spec.columns.length === 0) {
          throw new Error(DISTINCT_COLUMNS_MESSAGE);
        }
      }

      let selectList: string;

      if (aggregates.length > 0) {
        const groupCols = (spec.groupBy ?? []).map((entry) =>
          emitSelectColumn(entry, true, dialect, columns),
        );

        // Only the new `aggregates` form refuses a column named like the table. The single `aggregate` keeps its old
        // behaviour.
        (spec.aggregates ?? []).forEach((entry) => {
          if (entry.column !== undefined) {
            columns.refuseRowRead(entry.column, "an aggregate cannot use");
          }
        });

        selectList = [
          ...groupCols,
          ...aggregates.map((entry) => emitAggregate(entry, dialect, columns)),
        ].join(", ");
      } else {
        selectList =
          spec.columns && spec.columns.length > 0
            ? spec.columns
                .map((entry) =>
                  emitSelectColumn(entry, false, dialect, columns),
                )
                .join(", ")
            : "*";
      }

      const limit = emitLimit(spec.limit, dialect);

      // SQL clause order: SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY ... LIMIT.
      // DISTINCT is fixed text.
      const distinct = spec.distinct === true ? "DISTINCT " : "";

      body = `SELECT ${distinct}${selectList} FROM ${emitFrom(spec, dialect, columns)}${emitWhere(spec.filters, dialect, columns)}${emitGroupBy(spec.groupBy, dialect, columns)}${emitHaving(spec, dialect, columns)}${emitOrderBy(spec.orderBy, columns, bareResultNames(spec))}${limit};`;
      break;
    }
    case "INSERT": {
      if (!spec.values || spec.values.length === 0) {
        throw new Error("INSERT requires values");
      }

      const names = spec.values
        .map((entry) => columns.writeColumn(entry.column))
        .join(", ");
      const bindings = spec.values
        .map((entry) => emitBinding(entry.value))
        .join(", ");

      body = `INSERT INTO ${columns.table} (${names}) VALUES (${bindings});`;
      break;
    }
    case "UPDATE": {
      if (!spec.values || spec.values.length === 0) {
        throw new Error("UPDATE requires values");
      }

      const assignments = spec.values
        .map(
          (entry) =>
            `${columns.writeColumn(entry.column)} = ${emitBinding(entry.value)}`,
        )
        .join(", ");

      body = `UPDATE ${columns.table} SET ${assignments}${emitWhere(spec.filters, dialect, columns)};`;
      break;
    }
    case "DELETE": {
      body = `DELETE FROM ${columns.table}${emitWhere(spec.filters, dialect, columns)};`;
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
// The SQL text of a stored action. Oracle keeps it in formData.body.data (see buildActionDto), and that is the text
// it runs, so it wins over a stale actionConfiguration.body; every other SQL plugin keeps it in actionConfiguration.body.
export function storedSqlBody(actionConfiguration: unknown): unknown {
  const config = (actionConfiguration ?? {}) as {
    body?: unknown;
    formData?: { body?: { data?: unknown } };
  };

  return config.formData?.body?.data ?? config.body;
}

// Oracle's plugin and editor form read the query and the prepared-statement switch from formData, not from
// actionConfiguration.body and pluginSpecifiedTemplates.
const FORM_DATA_SQL_PACKAGES = new Set(["oracle-plugin"]);

export function buildActionDto(
  spec: QuerySpec,
  body: string,
  packageName?: string,
): Record<string, unknown> {
  const actionConfiguration =
    packageName !== undefined && FORM_DATA_SQL_PACKAGES.has(packageName)
      ? {
          formData: { body: { data: body }, preparedStatement: { data: true } },
        }
      : {
          body,
          // SQL plugins read the prepared-statement flag from pluginSpecifiedTemplates[0].value.
          pluginSpecifiedTemplates: [{ value: true }],
        };

  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    // A SELECT is a data fetch: run it on page load so a bound widget populates without a manual trigger (the query
    // is created after the layout, so the server's on-load analysis doesn't pick it up). Writes stay manual.
    executeOnLoad: spec.operation === "SELECT",
    actionConfiguration,
  };
}
