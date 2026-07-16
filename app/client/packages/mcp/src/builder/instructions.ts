import { WIDGET_CATALOG } from "./capabilities.js";
import { listPresets } from "./presets.js";

// M2 — instruction sets delivered through the MCP protocol as `resources` (reference/guides/recipes) and `prompts`
// (guided workflows). Everything here is inline TS (no external assets) so the build/tooling is unchanged, and
// every recipe/guide references only tools that actually exist. Data-layer wiring is intentionally NOT taught here;
// it arrives with the data layer so we never advertise a capability that isn't enabled.

export interface InstructionDoc {
  slug: string;
  title: string;
  description: string;
  render: () => string;
}

// --- reference/widgets — generated from the single WIDGET_CATALOG source (no forked list) -----------------------

function renderWidgetReference(): string {
  const lines = ["# Widget reference", ""];

  for (const widget of WIDGET_CATALOG) {
    lines.push(`## ${widget.type}`);
    lines.push(widget.purpose);
    lines.push("");
    lines.push("Fields:");

    for (const [field, shape] of Object.entries(widget.fields)) {
      lines.push(`- \`${field}\`: ${shape}`);
    }

    lines.push("");
  }

  lines.push(
    "Every widget also accepts an optional `name` (alphanumeric/underscore) and `placement`",
    "(`{ after: '<widgetName>' }` or `{ inside: '<containerName>' }`).",
  );

  return lines.join("\n");
}

// --- guides ----------------------------------------------------------------------------------------------------

const GUIDE_PLACEMENT = `# Placement guide

Widgets are auto-placed on a 64-column grid, stacked top-to-bottom in spec order.

- Omit \`placement\` to append below existing content.
- \`{ after: "Email" }\` places the widget just below the widget named \`Email\` (on the same canvas).
- \`{ inside: "DetailsCard" }\` places the widget inside a container's inner canvas.
- \`after\` and \`inside\` are mutually exclusive — set at most one.
- A placement that can't be resolved falls back to "append" and is reported in the response \`notes\`.

After a build or edit, call \`inspect_page\` (or read the inline \`diagnostics\`) to catch overlaps,
off-grid widgets, or a container that clips its contents, then fix and re-check.`;

const GUIDE_NAMING = `# Naming guide

- \`name\` must match \`[A-Za-z0-9_]+\` (letters, digits, underscore). No spaces, dashes, or punctuation.
- Names must be unique within a page — the compiler auto-suffixes collisions (Table, Table1, Table2…),
  but explicit, meaningful names make later \`edit_page\` placement (\`after\`/\`inside\`) reliable.
- If you omit \`name\`, a sensible default is assigned from the widget type.`;

const GUIDE_BINDINGS = `# Data & bindings guide

Agents never author raw expressions. Any field containing binding/template syntax
(\`{{ }}\`, \`\${ }\`, or backticks) is rejected — this keeps agent-authored content from being
evaluated as code in a viewer's browser.

- Static data: a table's \`data\` takes literal rows only — an array of flat objects of
  string/number/boolean/null cells. It is rendered as-is, never evaluated.
- Dynamic (query-backed) data: supplied through structured references, not hand-written
  \`{{ }}\`:
  - Bind a table to a query: \`{ "type": "table", "source": { "query": "getUsers" } }\`.
  - Run a query on a button click: \`{ "type": "button", "onClick": { "run": "insertRow" } }\`.
  The query name must be a plain identifier; the compiler emits the safe binding for you. These
  work when the data layer is enabled on the instance (list_datasources / get_datasource_structure
  help you discover what to query). A table sets \`data\` OR \`source\`, never both.
- IMPORTANT — the same table binding has a DIFFERENT prop name on each path:
  - Creating a table (\`build_application\` / \`edit_page\` spec): \`source: { query: "getUsers" }\`.
  - Patching an EXISTING table (\`patch_widgets\` update props): \`tableData: { query: "getUsers" }\`.
  On \`patch_widgets\`, \`source\` means a selected-row display binding (\`{ table, column }\`) —
  passing \`source: { query }\` there is rejected. \`read_semantic_page\` reports the binding back
  as \`tableData\`, matching the patch name.
- Display bindings (selected row): show or prefill from the table's selected row through the
  same structured-reference rule:
  - Detail text: \`{ "type": "text", "source": { "table": "Users", "column": "email" } }\`.
  - Edit-form prefill: \`{ "type": "input", "defaultValue": { "table": "Users", "column": "email" } }\`.
  Both are also available as \`patch_widgets\` update props (\`source\` on text, \`defaultValue\` on
  input) to upgrade an existing page. A text sets \`text\` OR \`source\`, never both.
- Event chains: \`wire_event\` wires one event, and a \`run\` action may chain
  \`onSuccess\`/\`onError\` follow-ups (run another query, close a modal, navigate, show an alert):
  \`{ "run": "insertUser", "onSuccess": [{ "run": "getUsers" }, { "closeModal": "AddUserModal" },
  { "showAlert": "Saved", "style": "success" }] }\` — the canonical submit → refresh → close flow.
  The action may also be an ordered LIST of 2–5 statements (at most one \`run\`, which alone
  carries \`onSuccess\`/\`onError\`) — e.g. a Clear button that empties a store key AND resets an
  input in one click.
- Accumulating results across runs (store accumulation): re-running a query REPLACES its
  \`data\`, so a query-bound table shows only the latest response. To build a table that grows
  with each run, accumulate rows in the Appsmith store:
  - \`wire_event\` verb \`appendToStore\`: \`{ "appendToStore": { "key": "zipResults", "query":
    "LookupZip" } }\` appends the query's response under the store key (an array response adds
    one row per record; an object response adds a single row). Add \`field\` (dotted identifier
    path) to append a nested array, OR \`fields\` to project named values into ONE row per run:
    \`"fields": [{ "as": "zip", "path": ["post code"] }, { "as": "state", "path": ["places", 0,
    "state"] }]\` — \`path\` is a list of string keys / numeric array indexes, so space-keyed and
    array-indexed API values are reachable.
  - \`wire_event\` verb \`clearStoreKey\`: \`{ "clearStoreKey": { "key": "zipResults" } }\` empties
    that ONE key (never the whole store).
  - Bind the table to the key: build/edit \`source: { "store": "zipResults" }\`, patch
    \`tableData: { "store": "zipResults" }\`.
  - Store keys are identifiers (letter/underscore start, max 64). Accumulated rows are
    SESSION-ONLY by design (never persisted to localStorage, so one user's rows can't leak to
    the next browser user): results reset on reload. See appsmith://recipe/zip-lookup for the
    full worked example.`;

export const GUIDES: InstructionDoc[] = [
  {
    slug: "placement",
    title: "Placement guide",
    description:
      "How auto-placement works and how to target it with after/inside.",
    render: () => GUIDE_PLACEMENT,
  },
  {
    slug: "naming",
    title: "Naming guide",
    description: "Rules and conventions for widget names.",
    render: () => GUIDE_NAMING,
  },
  {
    slug: "bindings",
    title: "Data & bindings guide",
    description: "Why raw expressions are rejected and how data binding works.",
    render: () => GUIDE_BINDINGS,
  },
];

// --- recipes (end-to-end walkthroughs; reference only tools that exist) -----------------------------------------

const RECIPE_CRUD = `# Recipe: CRUD page

Goal: a table of records with a details form to view/edit a selected row.

1. \`get_capabilities\` — confirm the widget set and spec shape.
2. \`get_preset\` with name \`crud\` — start from the ready CRUD layout.
3. Adapt the preset: rename the table and inputs to your entity, add/remove inputs to match
   your fields. Keep names alphanumeric and unique.
4. \`validate_app_spec\` — dry-run compile; fix any reported errors before building.
5. \`build_application\` — create the app. Read the inline \`diagnostics\`.
6. \`inspect_page\` — verify no overlaps/off-grid/clipped-container issues; \`edit_page\` to fix.

To make it live (when the data layer is enabled):
7. \`list_datasources\` — find your data source. If none exists yet, \`create_datasource\`
   provisions one: a PostgreSQL/MySQL/SQL Server database from host/port/database (unconfigured —
   ask the user to enter the password in Appsmith and Test & Save), or a REST API from a base
   \`url\` (created ready to use when the API needs no auth). No credentials pass through MCP.
8. \`get_datasource_structure\` — read its tables/columns.
9. \`create_query\` — e.g. a SELECT plus an UPDATE over your table (structured spec, no raw SQL).
10. Bind the table to the query — the prop name differs by path: on \`patch_widgets\` (existing
    table) use \`tableData\` = { query: '<name>' }; on \`edit_page\` (new table) use \`source\` =
    { query: '<name>' }. Then prefill the form inputs from the selection (\`defaultValue\` =
    { table: '<Table>', column: '<col>' }) and show read-only detail text (\`source\` =
    { table, column }).
11. \`wire_event\` — wire the save button: { run: '<updateQuery>', onSuccess: [{ run: '<selectQuery>' },
    { showAlert: 'Saved', style: 'success' }] } so the table refreshes after the write.
12. Publish LAST: \`build_application\` auto-deployed the app at creation, but that viewer copy is a
    scaffold — it does not include the wiring above until re-published. Once everything works, re-publish
    (\`prepare_publish\` -> \`confirm_publish\`, governed) and only then hand the user the \`viewerUrl\`.
    Without governance, share the \`editorUrl\` and relay the governance 'requires' message instead.`;

const RECIPE_FORM = `# Recipe: Form page

Goal: a labelled input form with a submit button, grouped in a card.

1. \`get_capabilities\`, then \`get_preset\` with name \`form\`.
2. Replace the inputs with your fields (set \`label\` and \`inputType\`), keep the submit button.
3. Group related fields with a \`container\` and place inputs \`{ inside: "<container>" }\`.
4. \`validate_app_spec\` → \`build_application\` → \`inspect_page\`, fixing any diagnostics.`;

const RECIPE_TABLE_DETAIL = `# Recipe: Master–detail page

Goal: a table above a details card (the common admin/read pattern).

1. \`get_preset\` with name \`table-detail\`.
2. Rename the table and the card's inputs to your entity/fields.
3. Add fields as inputs \`{ inside: "DetailsCard" }\` so they land in the card.
4. \`validate_app_spec\` → \`build_application\` → \`inspect_page\`.

Static layout today; wire the table to a query and the inputs to the selected row when the data
layer is enabled.`;

// The originating M5 field-report app, end to end: each lookup APPENDS a row to a results table (a re-run query
// would only replace it), using the closed store-accumulation vocabulary.
const RECIPE_ZIP_LOOKUP = `# Recipe: ZIP lookup with an accumulating results table

Goal: enter a ZIP code, click Lookup, and add one row per lookup to a results table that keeps
growing; a Clear button empties the table and the input.

1. Build the page (\`build_application\` / \`edit_page\`):
   - Input \`ZipInput\` with \`validation: { "format": "zipcode" }\`.
   - Button \`LookupButton\` (text "Lookup").
   - Button \`ClearButton\` (text "Clear").
   - Table \`ZipResults\` bound to the store key: \`source: { "store": "zipResults" }\`
     (on an EXISTING table: \`patch_widgets\` with \`tableData: { "store": "zipResults" }\`).
2. Create the lookup query (data layer): \`create_rest_api\` named \`LookupZip\` against the ZIP
   API. Its response has space-keyed and array-indexed values ("post code", places[0].state) —
   exactly what the \`fields\` projection below reaches.
3. Wire the Lookup button (\`wire_event\` on \`LookupButton\` onClick) — run the query, then
   append ONE projected row per lookup:

   { "run": "LookupZip", "onSuccess": [{ "appendToStore": { "key": "zipResults",
     "query": "LookupZip", "fields": [
       { "as": "zip", "path": ["post code"] },
       { "as": "city", "path": ["places", 0, "place name"] },
       { "as": "state", "path": ["places", 0, "state"] }
     ] } }] }

4. Wire the Clear button (\`wire_event\` on \`ClearButton\` onClick) — a statement LIST that
   empties the store key and resets the input in one click:

   [{ "clearStoreKey": { "key": "zipResults" } }, { "reset": "ZipInput" }]

5. \`inspect_page\` — a store-bound table whose key has no appendToStore/clearStoreKey writer on
   the page is flagged as a warning (the writer may legitimately live on another page).
6. Publish last: the copy auto-deployed by \`build_application\` predates all of this wiring, so
   it is a scaffold until re-published. Re-publish (\`prepare_publish\` -> \`confirm_publish\`,
   governed) and hand over the \`viewerUrl\` as the final step; without governance, share the
   \`editorUrl\` and relay the governance 'requires' message from \`get_capabilities\`.

Note: accumulated rows are SESSION-ONLY by design (the server compiles storeValue with
persist=false, so rows fetched under one user's permissions are never written to the shared
browser's localStorage) — the table resets on reload.`;

export const RECIPES: InstructionDoc[] = [
  {
    slug: "crud",
    title: "CRUD page recipe",
    description: "Build a table + details form from the crud preset.",
    render: () => RECIPE_CRUD,
  },
  {
    slug: "form",
    title: "Form page recipe",
    description: "Build a labelled input form from the form preset.",
    render: () => RECIPE_FORM,
  },
  {
    slug: "table-detail",
    title: "Master–detail recipe",
    description: "Build a table-above-details-card layout.",
    render: () => RECIPE_TABLE_DETAIL,
  },
  {
    slug: "zip-lookup",
    title: "ZIP lookup recipe (store accumulation)",
    description:
      "Build a lookup form whose results table grows one row per lookup via appendToStore.",
    render: () => RECIPE_ZIP_LOOKUP,
  },
];

export const WIDGET_REFERENCE: InstructionDoc = {
  slug: "widgets",
  title: "Widget reference",
  description: "Every widget type, its purpose, and its fields.",
  render: renderWidgetReference,
};

// --- prompts (guided workflows) --------------------------------------------------------------------------------

// Prompt args are string-only (MCP protocol). `fields` is a documented delimited string, parsed here.
export const FIELDS_FORMAT =
  'comma-separated "name:type" pairs, e.g. "name:TEXT, email:EMAIL, active:TEXT"';

interface ParsedField {
  name: string;
  inputType: "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD";
}

const INPUT_TYPES = new Set(["TEXT", "NUMBER", "EMAIL", "PASSWORD"]);

export function parseFields(fields: string): ParsedField[] {
  return fields
    .split(",")
    .map((pair) => pair.trim())
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [rawName, rawType] = pair.split(":").map((part) => part.trim());
      const upper = (rawType ?? "TEXT").toUpperCase();
      const inputType = (
        INPUT_TYPES.has(upper) ? upper : "TEXT"
      ) as ParsedField["inputType"];

      return { name: (rawName ?? "").replace(/[^A-Za-z0-9_]/g, ""), inputType };
    })
    .filter((field) => field.name.length > 0);
}

// Returns the concrete, ordered plan text for a scaffolding prompt — a single user-turn message that walks the
// agent through real tools with the caller's arguments already substituted.
export function scaffoldCrudPlan(entity: string, fields: string): string {
  const cleanEntity = entity.replace(/[^A-Za-z0-9_]/g, "") || "Record";
  const parsed = parseFields(fields);
  const fieldLines = parsed.length
    ? parsed.map((f) => `- ${f.name} (${f.inputType})`).join("\n")
    : "- (no fields parsed; add inputs for your entity's columns)";

  return `Build a CRUD page for "${cleanEntity}". Follow these steps, using the tools by name:

1. Call get_capabilities to confirm the widget set.
2. Call get_preset with { "name": "crud" } to get the starting layout.
3. Adapt the preset spec:
   - Rename the table to "${cleanEntity}Table".
   - Give the details card one input per field:
${fieldLines}
   - Keep names alphanumeric/underscore and unique.
4. Call validate_app_spec with the adapted app spec; fix any reported errors.
5. Call build_application with { "workspaceId": "<target workspace>", "app": <spec> }.
6. Read the returned diagnostics, then call inspect_page and resolve any issues with edit_page.

Table data is static for now. See appsmith://guide/bindings for how query-backed data works.`;
}

export function scaffoldFormPlan(entity: string, fields: string): string {
  const cleanEntity = entity.replace(/[^A-Za-z0-9_]/g, "") || "Record";
  const parsed = parseFields(fields);
  const fieldLines = parsed.length
    ? parsed.map((f) => `- ${f.name} (${f.inputType})`).join("\n")
    : "- (no fields parsed; add inputs for your form)";

  return `Build a form page for "${cleanEntity}". Use the tools by name:

1. Call get_capabilities, then get_preset with { "name": "form" }.
2. Adapt the spec: put these inputs inside a container named "${cleanEntity}Form":
${fieldLines}
   Keep the submit button. Names must be alphanumeric/underscore and unique.
3. Call validate_app_spec; fix errors.
4. Call build_application, then inspect_page and fix any diagnostics with edit_page.`;
}

// Presets referenced by the recipes above, surfaced for tests/consistency.
export function recipePresetNames(): string[] {
  return listPresets().map((preset) => preset.name);
}

// Server-level instructions returned in the MCP `initialize` response, so EVERY client (ChatGPT, Claude, ...) sees
// the full workflow and the fact that data/JS/governed capabilities exist — even before calling get_capabilities.
// This is the primary visibility surface: it must name the real tools and steer the agent to discover gated tools
// rather than assume the server can only scaffold.
// MAINTENANCE: this is hand-authored prose (MCP `instructions` cannot be generated). The tool names, widget list, and
// env-var names below are NOT bound to TOOL_CATALOG / WIDGET_CATALOG at compile time — on any tool rename, gate
// change, or widget addition, reconcile this string with those sources. The `SERVER_INSTRUCTIONS names only real
// tools + env vars` test guards against drift.
export const SERVER_INSTRUCTIONS = `Appsmith MCP — build and modify REAL Appsmith applications through a safe, structured API. You never write raw widget DSL, SQL, JS, or bindings; you call tools and the server compiles them under the user's own permissions.

ALWAYS call get_capabilities first. It lists the exact tools available under this deployment's configuration, plus 'disabledCapabilities' — capability groups that exist but are turned off (e.g. datasources/queries, JS objects, publish). If a capability you need is disabled, relay that group's 'requires' instruction to the user (it tells them to ask their Appsmith administrator to enable it) — do NOT claim the server cannot do it. Enabling is controlled by APPSMITH_MCP_DATA_ENABLED / APPSMITH_MCP_JS_ENABLED and a Mongo + Redis governance backend.

Recommended workflow for a production-quality app:
1. Target a workspace: resolve_workspace(name) -> workspaceId (or list_workspaces). Tools take an id, not a name — never ask the user for a raw id if they gave you a name.
2. Create the app: build_application(workspaceId, appSpec). Widgets: text, input, select, button, image, table, container, form, modal, datepicker, chart, tabs, list. Inputs support named-format validation; tables support a query 'source' (optionally clear-when-empty). 'list' renders a card grid (image + title + subtitle) bound to a query 'source' — point it at the same query as a table for a shared table/cards view (a query is required; there is no static-data card grid). The new app is auto-deployed on creation and the response includes an editorUrl and viewerUrl for the default page — that first deployed copy is only a scaffold until re-published, so don't hand out the viewer link yet.
3. Add data (if listed by get_capabilities): create_datasource (DB or REST, no credentials) -> create_query / create_rest_api -> bind a table to it, and bind detail widgets to the selected row.
4. Inspect and refine with read_semantic_page / inspect_page, then patch_widgets: bind a table's data, a text/image/input to the selected row (source / imageSource / defaultValue), toggle table search/filter/sort/pagination, set row striping, add input validation, disable a button while an input is invalid, and move/reparent/remove widgets. To switch between views (e.g. a table and a detail panel) with one control, gate each view's visibility on a select/tabs control (visibleWhen). Append new widgets with edit_page.
5. Wire behavior: wire_event connects button onClick / table onRowSelected / modal onClose / tabs onTabSelected to run a query (with onSuccess/onError chains), navigate, show/close a modal, show an alert, reset widgets (a Clear button), or accumulate query rows in the Appsmith store (appendToStore / clearStoreKey — bind a table to the key with a store source/tableData for a results table that grows with each run; rows are session-only). The action may also be an ordered list of 2-5 statements (at most one run).
6. Add JS logic (if listed): create_js_object for restricted, declarative JS objects.
7. Ship it LAST: finish wiring queries and events first — the copy auto-deployed at creation is a scaffold that goes stale as you edit. Then re-publish with prepare_publish -> confirm_publish (governed) and hand the user the viewerUrl as the final step. On deployments without governance, re-publishing is unavailable: relay the editorUrl from build_application plus the governance group's 'requires' instruction from get_capabilities instead of promising an up-to-date viewer link.

Read the appsmith://reference/widgets resource and appsmith://recipe/* walkthroughs for details. Prefer editing an existing app iteratively (read -> patch -> re-read) over rebuilding.`;
