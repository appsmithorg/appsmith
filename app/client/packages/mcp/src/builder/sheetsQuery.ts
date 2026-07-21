import { z } from "zod";

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

const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
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

const base = {
  name: bindingIdentifier,
  // No workspaceId: resolved server-authoritatively from applicationId (cross-tenant guard), like create_query.
  applicationId: z.string().min(1).max(128),
  pageId: z.string().min(1).max(128),
  datasourceId: z.string().min(1).max(128),
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
]);

export type SheetsQuerySpec = z.infer<typeof sheetsQuerySpecSchema>;
type ValueRef = z.infer<typeof valueRef>;

const MAX_BODY_BYTES = 8 * 1024;

// A `{{ }}` in a compiled Sheets row is ONLY ever a widget property path (literals are JSON tokens, never bindings).
const SAFE_BINDING =
  /^\{\{ [A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_.]* \}\}$/;

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
    !bindings.every((binding) => SAFE_BINDING.test(binding))
  ) {
    throw new Error("compiled Sheets row contains an unsafe binding");
  }
}

// A wrapped formData leaf, matching the exported Google Sheets action shape. The plugin executor reads `.data`;
// viewType/componentData are the editor's mirror (kept equal to data so the value round-trips in the UI).
function leaf(data: unknown): Record<string, unknown> {
  return { data, viewType: "component", componentData: data };
}

export interface CompiledSheetsQuery {
  command: "FETCH_MANY" | "INSERT_ONE";
  // The already-emitted row-object JSON (append only).
  rowObjects?: string;
}

export function compileSheetsQuery(spec: SheetsQuerySpec): CompiledSheetsQuery {
  if (spec.operation === "read") {
    return { command: "FETCH_MANY" };
  }

  const rowObjects = emitRow(spec.row);

  assertBodySafe(rowObjects);

  return { command: "INSERT_ONE", rowObjects };
}

// Build the Google Sheets ActionDTO. The datasource is an EMBEDDED { id } — its OAuth authentication and authorized
// spreadsheet set stay server-side. All command inputs are the strictly-validated identifiers above; the ONLY
// smart-substituted field is `rowObjects` (append), where widget bindings are parameterized at runtime.
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
      formData.where = leaf({ condition: "AND" });
    }

    // projection is a real array leaf (the plugin reads it as a List), not a JSON string.
    formData.projection = leaf(spec.columns ?? []);

    if (spec.limit !== undefined) {
      formData.pagination = leaf({ limit: String(spec.limit), offset: "0" });
    }
  } else {
    formData.rowObjects = leaf(compiled.rowObjects);
  }

  return {
    name: spec.name,
    pageId: spec.pageId,
    datasource: { id: spec.datasourceId },
    // A read is a data fetch: run it on page load so a widget bound to its result populates without a manual
    // trigger (the query is created AFTER the layout, so the server's on-load binding analysis doesn't pick it up —
    // this makes the intent explicit). An append is user-triggered (a button), so it stays manual.
    executeOnLoad: spec.operation === "read",
    actionConfiguration: { formData },
  };
}
