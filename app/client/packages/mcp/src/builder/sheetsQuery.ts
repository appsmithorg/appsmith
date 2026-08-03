import { z } from "zod";
import { storedId } from "./schema.js";

// M4-T2 create_sheets_query — a STRUCTURED Google Sheets query builder for an ALREADY-AUTHORIZED Sheets datasource
// (created and OAuth-authorized by a human in the Appsmith UI; MCP never carries OAuth tokens or creates the
// datasource). The agent only REFERENCES the authorized datasource and authors two safe operations:
//
//   READ   — FETCH_MANY rows from a sheet, optionally within a validated A1 cell range and/or a projected column set.
//            No agent-supplied value reaches the query: the range and column names are strictly-charset-validated
//            STATIC strings (Google Sheets only smart-substitutes the row-object fields, not the range/where/
//            projection), so there is nothing to parameterize and nothing to inject.
//   APPEND — INSERT_ONE a single row. The row object is emitted as JSON with validated column keys; every value is a
//            compile-time JSON literal or a checked `{{ Widget.path }}` binding. `rowObjects` IS a smart-substituted
//            field, so at runtime widget bindings are JSON-encoded (parameterized) before substitution — the same
//            safe mechanism the Mongo/SQL builders rely on.
//   UPDATE — UPDATE_ONE a single existing row IN PLACE. Same emitted-JSON row shape as APPEND, plus a reserved
//            `rowIndex` key that names WHICH data row to overwrite (the 0-based index a READ returns per row, or a
//            widget binding such as `{{ Table1.selectedRow.rowIndex }}`). The plugin re-reads that row, merges the
//            supplied columns over it, and writes it back — so a partial column set only touches the named columns.
//            Identical injection surface to APPEND: the row object is the only smart-substituted field and every
//            `{{ }}` in it is a compiler-emitted widget binding.
//   DELETE — DELETE_ONE a single existing row, addressed by a top-level `rowIndex` field (the same 0-based index, a
//            literal or a widget binding). rowIndex is NOT a smart-substituted field, so a widget binding is resolved
//            by client eval (registered via dynamicBindingPathList) — a literal is an integer string, never injectable.
//
// For the "specific sheets" (drive.file) OAuth modality the server pins execution to the datasource's authorized
// spreadsheet ids (GoogleSheetsPlugin.validateAndGetUserAuthorizedSheetIds), so a referenced sheetUrl can only reach a
// granted sheet. For a datasource authorized with the broad drive scope that check is a no-op, so the sheetUrl can
// target any spreadsheet the datasource's OAuth token can reach — bounded by the authenticated user's own grant and
// the per-request ACL (an agent can never reach another tenant's datasource), never wider than the user themselves.

// A Google Sheets spreadsheet URL. Not a secret — it names WHICH already-authorized spreadsheet to target. http(s)
// docs.google.com only, restricted charset, no whitespace/template/quote/brace so it cannot carry injection into the
// stored config. Exported for get_datasource_structure's sheet-discovery parameters, so the discovery path applies
// the same gate as the query builder.
export const sheetUrl = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .regex(
    /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_#=?&.-]*)?$/,
    "must be a https://docs.google.com/spreadsheets/d/... URL",
  );

// A sheet (tab) name. Placed as a literal in the API request path (it is NOT smart-substituted), so a tight charset
// keeps it from injecting into the A1 range Google Sheets builds (e.g. `Sheet1!A1`). Exported for
// get_datasource_structure's sheet discovery, same reasoning as sheetUrl.
export const sheetName = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_ .-]+$/, "sheet name has unsafe characters");

// A column header name. Embedded via JSON.stringify (defense in depth) and, for READ projections, sent as a literal;
// the charset excludes quote/backslash/brace/`$`/backtick so it cannot break out.
const sheetColumn = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_ .-]+$/, "column name has unsafe characters");

// A Google Sheets A1 cell range, e.g. "A2:Z", "A1:C100", "B:B". Strict charset (letters/digits/colon only); a static,
// validated string — never a binding.
const cellRange = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(
    /^[A-Za-z]{1,3}\d*(?::[A-Za-z]{1,3}\d*)?$/,
    "must be an A1 cell range",
  );

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

const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`|\u2028|\u2029/;
const literalScalar = z.union([
  z
    .string()
    .max(1000)
    .refine((value) => !RAW_EXPRESSION.test(value), "no template syntax"),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

// The ONLY place dynamic data enters an appended row: a literal (compile-time JSON token) or a widget reference
// (checked `{{ }}` binding, parameterized at runtime by smart substitution).
const valueRef = z.union([
  z.object({ literal: literalScalar }).strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

// Row filter for a READ: the agent picks a comparison from a CLOSED set; the compiler maps it to the Sheets plugin's
// ConditionalOperator. Only scalar comparisons are exposed (no IN/array ops in v1 — they need list values).
const FILTER_OPS = ["eq", "neq", "lt", "lte", "gt", "gte", "contains"] as const;
const FILTER_OPERATORS: Record<(typeof FILTER_OPS)[number], string> = {
  eq: "EQ",
  neq: "NOT_EQ",
  lt: "LT",
  lte: "LTE",
  gt: "GT",
  gte: "GTE",
  contains: "CONTAINS",
};

// One filter condition: a validated column, a closed operator, and a value that is a compile-time literal or a checked
// widget binding (same injection-safe shape as an appended value). Conditions combine with AND.
const filterCondition = z
  .object({
    column: sheetColumn,
    op: z.enum(FILTER_OPS),
    value: valueRef,
  })
  .strict();

// Which existing row an UPDATE targets: the 0-based rowIndex a READ returns for each row (the plugin adds the header
// offset — this is NOT the sheet's absolute row number). A literal non-negative integer, or a widget binding such as
// { widget: "Table1", property: "selectedRow.rowIndex" } for "update the row the user selected". Same two-shape,
// injection-safe form as valueRef, but the literal is constrained to a non-negative int since anything else fails the
// plugin's Integer.parseInt at runtime.
const rowIndexRef = z.union([
  z.object({ literal: z.number().int().min(0) }).strict(),
  z.object({ widget: bindingIdentifier, property: propertyPath }).strict(),
]);

// The reserved row-object key the Sheets plugin reads to locate the row to update (FieldName.ROW_INDEX). It is emitted
// by the compiler from `rowIndex`, so it can never be an agent-supplied column name.
const ROW_INDEX_KEY = "rowIndex";

const base = {
  name: bindingIdentifier,
  // No workspaceId: resolved server-authoritatively from applicationId (cross-tenant guard), like create_query.
  applicationId: storedId,
  pageId: storedId,
  datasourceId: storedId,
  sheetUrl,
  sheetName,
  // The 1-based header row index. A small bounded integer, never agent free-text.
  headerRow: z.number().int().min(1).max(1000).optional(),
};

export const sheetsQuerySpecSchema = z.discriminatedUnion("operation", [
  z
    .object({
      ...base,
      operation: z.literal("read"),
      // Optional A1 range; when omitted, all rows are fetched (paginated server-side).
      range: cellRange.optional(),
      // Optional column projection; when omitted, all columns are returned.
      columns: z.array(sheetColumn).max(100).optional(),
      limit: z.number().int().min(1).max(1000).optional(),
      // Optional server-side row filter (AND of conditions). Applies only to a plain row fetch (no `range`); the
      // plugin ignores a where clause in A1-RANGE mode, so filter + range is rejected at compile time. A filtered read
      // that returns just the matching rows is the live-count building block: bind a count text to it per category.
      filter: z.array(filterCondition).min(1).max(20).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      operation: z.literal("append"),
      // The row to append: validated column -> bind-param pairs.
      row: z
        .array(z.object({ column: sheetColumn, value: valueRef }).strict())
        .min(1)
        .max(100),
    })
    .strict(),
  z
    .object({
      ...base,
      operation: z.literal("update"),
      // Which existing row to overwrite (see rowIndexRef).
      rowIndex: rowIndexRef,
      // The columns to overwrite on that row: same validated column -> bind-param pairs as append. A partial set only
      // touches the named columns (the plugin merges over the row's current values). A column named `rowIndex` is
      // rejected at compile time — that key is reserved for addressing the row.
      row: z
        .array(z.object({ column: sheetColumn, value: valueRef }).strict())
        .min(1)
        .max(100),
    })
    .strict(),
  z
    .object({
      ...base,
      operation: z.literal("delete"),
      // Which existing row to remove: the 0-based rowIndex a read returns per row (a literal or a binding to the
      // selected table row). The plugin deletes exactly that one row (DELETE_ONE).
      rowIndex: rowIndexRef,
    })
    .strict(),
]);

export type SheetsQuerySpec = z.infer<typeof sheetsQuerySpecSchema>;
type ValueRef = z.infer<typeof valueRef>;
type RowIndexRef = z.infer<typeof rowIndexRef>;
type FilterCondition = z.infer<typeof filterCondition>;

const MAX_BODY_BYTES = 8 * 1024;

// A `{{ }}` in a compiled Sheets row is ONLY ever a widget property path (literals are JSON tokens, never bindings).
const SAFE_BINDING =
  /^\{\{ [A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \}\}$/;

// The self-escaping form emitted for a where-clause value (see emitWhere). Matched literally — everything except the
// widget and property identifiers is fixed text — so this stays as fail-closed as SAFE_BINDING and cannot be
// satisfied by anything the compiler did not emit.
const SAFE_ESCAPED_BINDING =
  /^\{\{ JSON\.stringify\(String\([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \?\? ''\)\)\.slice\(1, -1\) \}\}$/;

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

// Emit the row object `{ "col": <value>, ... }` for INSERT_ONE. Keys are JSON-encoded; values via emitValue.
function emitRow(row: { column: string; value: ValueRef }[]): string {
  const parts = row.map(
    (entry) => `${JSON.stringify(entry.column)}: ${emitValue(entry.value)}`,
  );

  return `{ ${parts.join(", ")} }`;
}

// Emit the row object `{ "rowIndex": <index>, "col": <value>, ... }` for UPDATE_ONE. The reserved rowIndex key is
// compiler-emitted and always leads; a supplied column that collides with it is rejected (it would produce a
// duplicate/ambiguous key and let an agent-named column masquerade as the row address).
function emitUpdateRow(
  rowIndex: RowIndexRef,
  row: { column: string; value: ValueRef }[],
): string {
  for (const entry of row) {
    if (entry.column === ROW_INDEX_KEY) {
      throw new Error(
        `"${ROW_INDEX_KEY}" is reserved for addressing the row to update and cannot be an updated column`,
      );
    }
  }

  const head = `${JSON.stringify(ROW_INDEX_KEY)}: ${emitValue(rowIndex)}`;
  const parts = row.map(
    (entry) => `${JSON.stringify(entry.column)}: ${emitValue(entry.value)}`,
  );

  return `{ ${[head, ...parts].join(", ")} }`;
}

// Fail-closed defense-in-depth: single JSON braces are fine, but every DOUBLE-brace pair must be a compiler-emitted
// widget binding, and there can be no `${`/backtick. Mirrors restApi.ts / mongoQuery.ts.
function assertBodySafe(body: string): void {
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("compiled Sheets row exceeds the size limit");
  }

  if (/\$\{|`/.test(body)) {
    throw new Error("compiled Sheets row contains forbidden template syntax");
  }

  const openings = (body.match(/\{\{/g) ?? []).length;
  const closings = (body.match(/\}\}/g) ?? []).length;
  const bindings = body.match(/\{\{ [^}]* \}\}/g) ?? [];

  if (
    openings !== closings ||
    openings !== bindings.length ||
    !bindings.every(
      (binding) =>
        SAFE_BINDING.test(binding) || SAFE_ESCAPED_BINDING.test(binding),
    )
  ) {
    throw new Error("compiled Sheets row contains an unsafe binding");
  }
}

// Emit the WHERE clause for a filtered read as a JSON string: `{"condition":"AND","children":[{...}]}`. Each child is
// { condition: <operator>, key: <column>, value: <literal-or-binding> }. The plugin casts a condition's value to a
// String and its filter service compares it in memory (Sheets has no query language — there is nothing to inject
// into). A literal value is JSON-encoded (so quotes/backslashes can't malform the string); a widget value is a
// checked `{{ Widget.prop }}` binding that the client eval resolves before execution (see buildSheetsActionDto's
// dynamicBindingPathList). Returns whether any value is a binding so the caller can register the eval path.
//
// The where field is NOT one of the plugin's smart-substituted jsonFields (only rowObject/rowObjects are), so eval
// interpolates a widget-bound value textually into this JSON string. Escaping the emitted template is therefore not
// enough: JSON.stringify runs at COMPILE time and only escapes the `{{ ... }}` placeholder, while the RESOLVED value
// is spliced in afterwards, raw. A value such as `x","key":"salary` would close the value string and add fields, so a
// user who controls the bound widget could rewrite which column is filtered or drop the condition entirely — a filter
// bypass that returns rows the filter existed to withhold.
//
// The fix is to make the binding escape its own resolved value: it emits `JSON.stringify(...).slice(1, -1)`, which
// yields the value with quotes and backslashes already escaped but WITHOUT the surrounding quotes, so it slots into
// the quoted position the template already provides. A `"` in the value arrives as `\"` and can no longer close the
// string. The emitted document therefore stays valid JSON both before eval (the binding is an ordinary string) and
// after it. Note the expression uses single quotes for the nullish fallback — the document is JSON-encoded, and a
// double quote inside the binding would be escaped to `\"` and stop being valid JS by the time eval sees it.
function emitWhere(filter: FilterCondition[]): {
  json: string;
  hasBinding: boolean;
} {
  let hasBinding = false;

  const children = filter.map((entry) => {
    let value: string;

    if ("literal" in entry.value) {
      // The plugin compares the value as a String; render the literal in its string form. JSON.stringify below
      // escapes it, so a value containing a quote cannot break out of the emitted string.
      value = String(entry.value.literal);
    } else {
      const binding = `{{ ${entry.value.widget}.${entry.value.property} }}`;

      if (!SAFE_BINDING.test(binding)) {
        throw new Error(`unsafe binding emitted: ${binding}`);
      }

      hasBinding = true;
      value = `{{ JSON.stringify(String(${entry.value.widget}.${entry.value.property} ?? '')).slice(1, -1) }}`;
    }

    return { condition: FILTER_OPERATORS[entry.op], key: entry.column, value };
  });

  return { json: JSON.stringify({ condition: "AND", children }), hasBinding };
}

// A wrapped formData leaf, matching the exported Google Sheets action shape. The plugin executor reads `.data`;
// viewType/componentData are the editor's mirror (kept equal to data so the value round-trips in the UI).
function leaf(data: unknown): Record<string, unknown> {
  return { data, viewType: "component", componentData: data };
}

// A JSON-view leaf: `.data` is a JSON STRING the plugin parses back into an object (getDataValueSafelyFromFormData
// only parses when viewType === "json"). Used for the filtered read's where clause so a single dynamicBindingPathList
// entry (formData.where.data) lets eval resolve every `{{ }}` inside it in one pass.
function jsonLeaf(json: string): Record<string, unknown> {
  return { data: json, viewType: "json", componentData: JSON.parse(json) };
}

// Emit the top-level `rowIndex` field for DELETE_ONE (NOT inside rowObjects — the plugin reads formData.rowIndex and
// parses it as an int). A literal renders as its integer string; a widget value is a checked `{{ }}` binding the
// client eval resolves before execution (registered via dynamicBindingPathList). Returns whether it is a binding.
function emitRowIndex(rowIndex: RowIndexRef): {
  value: string;
  hasBinding: boolean;
} {
  if ("literal" in rowIndex) {
    return { value: String(rowIndex.literal), hasBinding: false };
  }

  const binding = `{{ ${rowIndex.widget}.${rowIndex.property} }}`;

  if (!SAFE_BINDING.test(binding)) {
    throw new Error(`unsafe binding emitted: ${binding}`);
  }

  return { value: binding, hasBinding: true };
}

export interface CompiledSheetsQuery {
  command: "FETCH_MANY" | "INSERT_ONE" | "UPDATE_ONE" | "DELETE_ONE";
  // The already-emitted row-object JSON (append and update only).
  rowObjects?: string;
  // The already-emitted where-clause JSON string (filtered read only), and whether it carries a widget binding.
  where?: string;
  whereHasBinding?: boolean;
  // The already-emitted rowIndex field (delete only), and whether it carries a widget binding.
  rowIndex?: string;
  rowIndexHasBinding?: boolean;
}

// Compile-time exhaustiveness helper: `spec` is narrowed to `never` once every operation is handled, so an added
// union member that isn't handled above becomes a type error at the call site.
function assertNever(spec: never): never {
  throw new Error(
    `unhandled Sheets operation: ${JSON.stringify(spec as unknown)}`,
  );
}

export function compileSheetsQuery(spec: SheetsQuerySpec): CompiledSheetsQuery {
  if (spec.operation === "read") {
    if (spec.filter !== undefined) {
      if (spec.range !== undefined) {
        // The plugin only applies a where clause in ROWS mode; in A1-RANGE mode it is silently ignored, so refuse the
        // combination rather than emit a filter that never runs.
        throw new Error(
          "a filtered read cannot also specify a range (the Sheets where clause is ignored in A1-range mode)",
        );
      }

      const { hasBinding, json } = emitWhere(spec.filter);

      assertBodySafe(json);

      return {
        command: "FETCH_MANY",
        where: json,
        whereHasBinding: hasBinding,
      };
    }

    return { command: "FETCH_MANY" };
  }

  if (spec.operation === "append") {
    const rowObjects = emitRow(spec.row);

    assertBodySafe(rowObjects);

    return { command: "INSERT_ONE", rowObjects };
  }

  if (spec.operation === "update") {
    const rowObjects = emitUpdateRow(spec.rowIndex, spec.row);

    assertBodySafe(rowObjects);

    return { command: "UPDATE_ONE", rowObjects };
  }

  if (spec.operation === "delete") {
    const { hasBinding, value } = emitRowIndex(spec.rowIndex);

    // The value is already a checked SAFE_BINDING token or an integer string; assert it for emitter symmetry with the
    // other paths (defense in depth — no `${`/backtick, any `{{ }}` is a compiler-emitted binding).
    assertBodySafe(value);

    return {
      command: "DELETE_ONE",
      rowIndex: value,
      rowIndexHasBinding: hasBinding,
    };
  }

  // Exhaustiveness guard: the discriminated union has no other operation, so this is unreachable — but an explicit
  // check means a newly added operation fails to compile here rather than silently falling through.
  return assertNever(spec);
}

// Build the Google Sheets ActionDTO. The datasource is an EMBEDDED { id } — its OAuth authentication and authorized
// spreadsheet set stay server-side. All command inputs are the strictly-validated identifiers above; the ONLY
// smart-substituted field is `rowObjects` (append/update), where widget bindings are parameterized at runtime.
export function buildSheetsActionDto(
  spec: SheetsQuerySpec,
  compiled: CompiledSheetsQuery,
): Record<string, unknown> {
  const headerRow = String(spec.headerRow ?? 1);

  const formData: Record<string, unknown> = {
    command: leaf(compiled.command),
    entityType: leaf("ROWS"),
    sheetUrl: leaf(spec.sheetUrl),
    sheetName: leaf(spec.sheetName),
    tableHeaderIndex: leaf(headerRow),
    smartSubstitution: leaf(true),
  };

  if (spec.operation === "read") {
    // RANGE mode when an explicit A1 range is given; otherwise a plain row fetch (empty where -> all rows). Neither
    // path takes an agent-supplied value.
    if (spec.range !== undefined) {
      formData.queryFormat = leaf("RANGE");
      formData.range = leaf(spec.range);
    } else {
      formData.queryFormat = leaf("ROWS");
      // A filtered read carries a compiled where clause (JSON leaf so eval can resolve any binding inside it);
      // otherwise the empty AND fetches every row — the previously verified behaviour.
      formData.where =
        compiled.where !== undefined
          ? jsonLeaf(compiled.where)
          : leaf({ condition: "AND" });
    }

    // projection is a real array leaf (the plugin reads it as a List), not a JSON string.
    formData.projection = leaf(spec.columns ?? []);

    if (spec.limit !== undefined) {
      formData.pagination = leaf({ limit: String(spec.limit), offset: "0" });
    }
  } else if (spec.operation === "delete") {
    // DELETE_ONE reads a top-level rowIndex field (NOT rowObjects); a widget binding inside it is eval-resolved.
    formData.rowIndex = leaf(compiled.rowIndex);
  } else {
    // append (INSERT_ONE) and update (UPDATE_ONE) share the smart-substituted rowObjects field; the command leaf
    // above already distinguishes them, and update's rowObjects carries the reserved rowIndex key.
    formData.rowObjects = leaf(compiled.rowObjects);
  }

  // Client-eval binding paths: a widget-bound filter value (where.data) or a widget-bound delete rowIndex
  // (rowIndex.data) is resolved by the eval engine before execution, so register the field(s) that carry a binding.
  const bindingPaths: { key: string }[] = [];

  if (compiled.whereHasBinding)
    bindingPaths.push({ key: "formData.where.data" });

  if (compiled.rowIndexHasBinding)
    bindingPaths.push({ key: "formData.rowIndex.data" });

  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    // A read is a data fetch: run it on page load so a widget bound to its result populates without a manual
    // trigger (the query is created AFTER the layout, so the server's on-load binding analysis doesn't pick it up —
    // this makes the intent explicit). An append/update/delete mutates the sheet and is user-triggered (a button),
    // so it stays manual.
    executeOnLoad: spec.operation === "read",
    actionConfiguration: {
      formData,
      ...(bindingPaths.length > 0
        ? { dynamicBindingPathList: bindingPaths }
        : {}),
    },
  };
}
