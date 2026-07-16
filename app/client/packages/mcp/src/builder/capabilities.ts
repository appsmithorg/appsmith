import { GRID_COLUMNS, ROW_HEIGHT } from "./layout.js";
import { listPresets } from "./presets.js";

// A machine-readable catalog so the caller's agent can discover what it can build and how to shape a page spec,
// without reading source or guessing.

// Single source of truth for the widget catalog. The `reference/widgets` MCP resource is generated from this — do
// not fork it. Field docs must reflect the real (safe) accepted shapes: agents never author raw `{{ }}` expressions,
// so no field advertises binding syntax.
export const WIDGET_CATALOG = [
  {
    type: "text",
    fields: {
      text: "plain string (no binding/template syntax)",
      source:
        "{ table: '<tableWidget>', column: '<column>' } — show the selected row's column (detail views). Use text OR source, not both.",
    },
    purpose: "Static text / headings, or a bound detail field.",
  },
  {
    type: "input",
    fields: {
      label: "string",
      inputType: "TEXT | NUMBER | EMAIL | PASSWORD",
      defaultValue:
        "{ table: '<tableWidget>', column: '<column>' } — prefill from the selected row (edit forms)",
      validation:
        "{ format: 'zipcode'|'email'|'number'|'integer'|'usPhone', message? } — vetted regex + error message; makes the input required (never author a raw regex)",
    },
    purpose:
      "Single-line text entry. Pair validation with a button's disableWhenInvalid (patch_widgets) so bad input can't run a query.",
  },
  {
    type: "select",
    fields: {
      label: "string",
      options: "{ label: string, value: string|number }[] — static options",
      optionsSource:
        "{ query: '<queryName>', field?: '<responsePath>', label: '<column>', value: '<column>' } — bind the dropdown to a query's rows; label/value name the columns for each option's text/value. Use options OR optionsSource, not both (data layer).",
    },
    purpose: "Dropdown selection (static options or query-bound).",
  },
  {
    type: "button",
    fields: {
      text: "string",
      onClick: "{ run: '<queryName>' } — runs a named query (data layer)",
    },
    purpose: "Trigger an action.",
  },
  {
    type: "image",
    fields: { image: "string url" },
    purpose: "Display an image.",
  },
  {
    type: "table",
    fields: {
      data: "{ [column]: string|number|boolean|null }[] — static literal rows",
      source:
        "{ query: '<queryName>', field?: '<responsePath>', clearWhenEmpty?: '<inputWidget>' } — bind to a query's data, optionally a nested array like 'places'; clearWhenEmpty gates the rows on an input holding text so resetting the input clears the table (data layer). OR { store: '<storeKey>' } — bind to rows accumulated in the Appsmith store by wire_event's appendToStore verb (accumulating-results tables; session-only, cleared by clearStoreKey or a reload).",
    },
    purpose:
      "Tabular data with search/sort/pagination. Use `data` for static rows OR `source` to bind a query or a store key (not both). Style alternating rows via patch_widgets oddRowColor/evenRowColor. NOTE: when PATCHING an existing table, this binding is the `tableData` prop (see patchSpec) — `source` on patch_widgets means a selected-row ref.",
  },
  {
    type: "container",
    fields: { children: "widget spec[]" },
    purpose: "Group widgets into a card; nest other widgets inside.",
  },
  {
    type: "form",
    fields: {
      submitLabel: "string (submit button text)",
      children: "widget spec[] (the form fields)",
    },
    purpose: "Group input fields with an auto-added submit button.",
  },
  {
    type: "modal",
    fields: {
      title: "string",
      children: "widget spec[] (modal body)",
    },
    purpose: "An overlay dialog for add/edit/confirm flows.",
  },
  {
    type: "datepicker",
    fields: { label: "string" },
    purpose: "Pick a date/time value.",
  },
  {
    type: "checkbox",
    fields: {
      label: "string",
      defaultChecked: "boolean — initial checked state (defaults to true)",
    },
    purpose: "A single boolean checkbox.",
  },
  {
    type: "switch",
    fields: {
      label: "string",
      defaultChecked: "boolean — initial on/off state (defaults to true)",
    },
    purpose: "A boolean on/off toggle.",
  },
  {
    type: "radio",
    fields: {
      label: "string",
      options:
        "{ label: string, value: string|number }[] — static single-select options",
    },
    purpose: "Single-select radio group (choose exactly one option).",
  },
  {
    type: "multiselect",
    fields: {
      label: "string",
      options: "{ label: string, value: string|number }[] — static options",
    },
    purpose: "Multi-select dropdown (choose several options).",
  },
  {
    type: "filepicker",
    fields: { label: "string" },
    purpose: "Upload one or more files.",
  },
  {
    type: "chart",
    fields: {
      title: "string",
      chartType:
        "LINE_CHART | BAR_CHART | PIE_CHART | COLUMN_CHART | AREA_CHART",
      series: "{ name?: string, points?: { x, y }[] }[] — static series",
      source:
        "{ query: '<queryName>', field?: '<responsePath>', x: '<column>', y: '<column>' } — bind the chart to a query's rows; x is the category/label column and y the numeric value column. Use series OR source, not both (data layer).",
    },
    purpose: "Visualize static series data or a query's rows.",
  },
  {
    type: "tabs",
    fields: {
      tabs: "{ label: string, children?: widget spec[] }[]",
    },
    purpose: "Organize content into tabs, each with its own canvas.",
  },
  {
    type: "list",
    fields: {
      source:
        "{ query: string, field?: string } (bind to the same query as a table for a shared table/cards view)",
      title: "item field name for the card title",
      image: "item field name for the card image (optional)",
      subtitle: "item field name for the card subtitle (optional)",
      pageSize: "cards per page (optional)",
    },
    purpose:
      "A card grid: repeats an image + title + subtitle card over a data source's rows.",
  },
] as const;

// Gate under which a tool is registered. Kept as the SINGLE source of truth so get_capabilities can never drift from
// what buildMcpServer actually registers (item J). When a tool is added/removed, update this list.
type ToolGate =
  | "always"
  | "governance"
  | "data"
  | "data_governance"
  | "js"
  | "js_governance";

export interface CapabilityGates {
  data: boolean;
  js: boolean;
  governance: boolean;
}

export const TOOL_CATALOG: { name: string; gate: ToolGate; summary: string }[] =
  [
    // Always-on: discovery, spec authoring, and safe reads.
    {
      name: "list_workspaces",
      gate: "always",
      summary: "list accessible workspaces as { id, name }",
    },
    {
      name: "resolve_workspace",
      gate: "always",
      summary: "resolve a workspace name to its id",
    },
    {
      name: "list_applications",
      gate: "always",
      summary: "list applications in a workspace",
    },
    {
      name: "get_application_context",
      gate: "always",
      summary: "read a page + layout",
    },
    { name: "get_capabilities", gate: "always", summary: "this catalog" },
    { name: "list_presets", gate: "always", summary: "ready page specs" },
    { name: "get_preset", gate: "always", summary: "get a preset page spec" },
    {
      name: "validate_app_spec",
      gate: "always",
      summary: "dry-run compile a spec",
    },
    {
      name: "build_application",
      gate: "always",
      summary:
        "create an app from a spec (auto-deployed on creation; returns editor/viewer URLs)",
    },
    { name: "edit_page", gate: "always", summary: "append widgets to a page" },
    {
      name: "patch_widgets",
      gate: "always",
      summary: "typed widget update/move/remove",
    },
    {
      name: "wire_event",
      gate: "always",
      summary:
        "wire a widget event to a safe action or a 2-5 statement list (chainable onSuccess/onError; appendToStore/clearStoreKey accumulate query rows in the store)",
    },
    { name: "inspect_page", gate: "always", summary: "lint a live page" },
    {
      name: "read_semantic_page",
      gate: "always",
      summary: "safe page read + revision",
    },
    {
      name: "read_pages",
      gate: "always",
      summary: "safe page list + revision",
    },
    {
      name: "read_theme",
      gate: "always",
      summary: "safe theme tokens + revision",
    },
    {
      name: "read_publish_status",
      gate: "always",
      summary: "publish state + revision",
    },
    // Governed mutations + audit/rollback + publish (require Mongo+Redis governance).
    {
      name: "update_theme",
      gate: "governance",
      summary: "change theme tokens (governed)",
    },
    {
      name: "create_page",
      gate: "governance",
      summary: "create a blank page (governed)",
    },
    {
      name: "rename_page",
      gate: "governance",
      summary: "rename a page (governed)",
    },
    {
      name: "prepare_delete_page",
      gate: "governance",
      summary: "prepare page delete (confirmation)",
    },
    {
      name: "confirm_delete_page",
      gate: "governance",
      summary: "delete a page with a token",
    },
    { name: "list_changes", gate: "governance", summary: "audit history" },
    {
      name: "list_all_changes",
      gate: "governance",
      summary: "admin-only cross-actor audit history",
    },
    {
      name: "get_any_change",
      gate: "governance",
      summary: "admin-only cross-actor audit record",
    },
    { name: "get_change", gate: "governance", summary: "one audit record" },
    {
      name: "get_change_diff",
      gate: "governance",
      summary: "semantic change summary",
    },
    {
      name: "prepare_rollback",
      gate: "governance",
      summary: "prepare a layout rollback",
    },
    {
      name: "confirm_rollback",
      gate: "governance",
      summary: "roll back a layout change",
    },
    {
      name: "prepare_publish",
      gate: "governance",
      summary: "prepare re-publish of an existing app (confirmation)",
    },
    {
      name: "confirm_publish",
      gate: "governance",
      summary: "re-deploy an existing app with a token",
    },
    // Data layer (APPSMITH_MCP_DATA_ENABLED).
    { name: "list_datasources", gate: "data", summary: "discover datasources" },
    {
      name: "create_datasource",
      gate: "data",
      summary:
        "create a DB (Postgres/MySQL/MSSQL/Mongo, unconfigured) or REST (base URL) datasource; no credentials (Sheets needs UI OAuth)",
    },
    {
      name: "get_datasource_structure",
      gate: "data",
      summary: "datasource tables/columns",
    },
    { name: "list_actions", gate: "data", summary: "safe action metadata" },
    { name: "create_query", gate: "data", summary: "structured SQL query" },
    {
      name: "create_mongo_query",
      gate: "data",
      summary: "structured MongoDB find/insert query",
    },
    {
      name: "create_sheets_query",
      gate: "data",
      summary: "structured Google Sheets read/append query",
    },
    {
      name: "create_rest_api",
      gate: "data",
      summary: "structured REST action",
    },
    {
      name: "get_action",
      gate: "data",
      summary: "safe action read + revision",
    },
    {
      name: "run_action",
      gate: "data",
      summary: "run a read-only action",
    },
    // Data + governance.
    {
      name: "update_action",
      gate: "data_governance",
      summary: "update an action (governed)",
    },
    {
      name: "duplicate_action",
      gate: "data_governance",
      summary: "duplicate an action (governed)",
    },
    {
      name: "prepare_delete_action",
      gate: "data_governance",
      summary: "prepare action delete",
    },
    {
      name: "confirm_delete_action",
      gate: "data_governance",
      summary: "delete an action with a token",
    },
    {
      name: "prepare_run_action",
      gate: "data_governance",
      summary: "prepare a confirmed action run",
    },
    {
      name: "confirm_run_action",
      gate: "data_governance",
      summary: "run an action with a token",
    },
    // Restricted JS objects (APPSMITH_MCP_JS_ENABLED).
    {
      name: "read_js_object",
      gate: "js",
      summary: "safe JS-object metadata + revisions",
    },
    {
      name: "create_js_object",
      gate: "js_governance",
      summary: "create a restricted JS object (governed)",
    },
    {
      name: "update_js_object",
      gate: "js_governance",
      summary: "update a restricted JS object (governed)",
    },
    {
      name: "prepare_delete_js_object",
      gate: "js_governance",
      summary: "prepare JS-object delete",
    },
    {
      name: "confirm_delete_js_object",
      gate: "js_governance",
      summary: "delete a JS object with a token",
    },
  ];

function gateActive(gate: ToolGate, gates: CapabilityGates): boolean {
  switch (gate) {
    case "always":
      return true;
    case "governance":
      return gates.governance;
    case "data":
      return gates.data;
    case "data_governance":
      return gates.data && gates.governance;
    case "js":
      return gates.js;
    case "js_governance":
      return gates.js && gates.governance;
  }
}

// What each (non-always) gate requires to be enabled, and what it unlocks — so an agent can SEE a capability that is
// currently off and tell the user exactly which setting turns it on, instead of assuming the server simply can't do it.
// `requires` is phrased as a HUMAN-facing instruction (so an agent relaying it gives an end user something they can
// act on), with the exact self-hosted env var / backend in parentheses. On Appsmith Cloud the end user cannot set
// these — the ask still correctly points at "your Appsmith administrator".
const GATE_REQUIREMENTS: Record<
  Exclude<ToolGate, "always">,
  { requires: string; provides: string }
> = {
  governance: {
    requires:
      "ask your Appsmith administrator to configure MCP governance (a Mongo + Redis backend)",
    // Publish-on-create is NOT gated here: build_application auto-deploys the app it just created on every
    // deployment. Governance gates RE-publishing existing apps (prepare_publish/confirm_publish).
    provides:
      "governed edits, page create/delete, re-publish of existing apps (new apps auto-deploy on creation), audit history, rollback",
  },
  data: {
    requires:
      "ask your Appsmith administrator to enable the MCP data layer (self-hosted: env APPSMITH_MCP_DATA_ENABLED)",
    provides: "datasources, SQL/REST queries, action reads and read-only runs",
  },
  data_governance: {
    requires:
      "ask your Appsmith administrator to enable the MCP data layer and configure governance (self-hosted: env APPSMITH_MCP_DATA_ENABLED plus a Mongo + Redis backend)",
    provides: "governed action edits/deletes and confirmed action runs",
  },
  js: {
    requires:
      "ask your Appsmith administrator to enable MCP JS objects (self-hosted: env APPSMITH_MCP_JS_ENABLED)",
    provides: "restricted (declarative) JS objects",
  },
  js_governance: {
    requires:
      "ask your Appsmith administrator to enable MCP JS objects and configure governance (self-hosted: env APPSMITH_MCP_JS_ENABLED plus a Mongo + Redis backend)",
    provides: "governed JS-object edits/deletes",
  },
};

// The capability groups that are NOT registered under the current gates, grouped by the setting that enables them,
// each listing the exact tool names it would add. Surfacing this (rather than silently hiding the tools) lets an
// agent advise the user how to unlock data-backed, JS, or governed features.
function disabledCapabilities(gates: CapabilityGates) {
  const groups = new Map<
    string,
    { requires: string; provides: string; tools: string[] }
  >();

  for (const tool of TOOL_CATALOG) {
    if (tool.gate === "always" || gateActive(tool.gate, gates)) continue;

    const requirement = GATE_REQUIREMENTS[tool.gate];
    const group = groups.get(tool.gate) ?? { ...requirement, tools: [] };

    group.tools.push(tool.name);
    groups.set(tool.gate, group);
  }

  return [...groups.values()];
}

export function getCapabilities(
  gates: CapabilityGates = { data: false, js: false, governance: false },
) {
  const disabledGroups = disabledCapabilities(gates);

  return {
    description:
      "Build and safely modify Appsmith apps. The MCP layer auto-places widgets on a 64-column grid and compiles to " +
      "real Appsmith artifacts via the ACL-enforced API. You never author raw widget DSL, SQL, or bindings.",
    widgets: WIDGET_CATALOG,
    common: {
      name: "optional widget name (alphanumeric/underscore); auto-named if omitted",
      placement:
        "optional { after: '<widgetName>' } or { inside: '<containerName>' }; omitted appends below existing content (best-effort)",
    },
    pageSpec: {
      name: "page name",
      widgets: "widget spec[] (see `widgets`)",
    },
    appSpec: { name: "application name", pages: "page spec[]" },
    editSpec: { add: "widget spec[] — appended to an existing page" },
    // The patch_widgets vocabulary. Deliberately enumerated here because the prop names differ from the
    // build/edit spec in one place (tableData vs source) and agents are steered to this document first.
    patchSpec: {
      shape:
        "{ operations: [{ kind: 'update', name: '<widget>', props: {...} } | { kind: 'move', name, placement } | { kind: 'remove', name }] }",
      updateProps: {
        literals:
          "text, label, inputType, options, title, image, chartType, chartName, defaultText, placeholderText, dateFormat, isRequired, isDisabled, isVisible, oddRowColor, evenRowColor, isVisibleSearch, enableClientSideSearch, isVisibleFilters, isSortable, isVisibleDownload, isVisiblePagination",
        tableData:
          "{ query: '<queryName>', field?: '<responsePath>', clearWhenEmpty?: '<inputWidget>' } OR { store: '<storeKey>' } — bind an EXISTING table's rows to a query, or to a store key accumulated by wire_event's appendToStore (session-only). This is the patch-path name for the build spec's `source`; read_semantic_page also reports it as tableData.",
        source:
          "{ table: '<Table>', column: '<col>' } — selected-row display binding on a text widget. NOT the table data binding (use tableData for that).",
        defaultValue:
          "{ table: '<Table>', column: '<col>' } — selected-row prefill on an input widget",
        visibleWhen: "{ control: '<widget>', equals: <literal> }",
        validation: "input validation spec",
        disableWhenInvalid: "boolean (button)",
      },
    },
    presets: listPresets(),
    grid: { columns: GRID_COLUMNS, rowHeightPx: ROW_HEIGHT },
    // Generated from the single TOOL_CATALOG so this list can never drift from what is actually registered.
    tools: TOOL_CATALOG.filter((tool) => gateActive(tool.gate, gates)).map(
      (tool) => `${tool.name} — ${tool.summary}`,
    ),
    gates: {
      dataLayer: gates.data,
      restrictedJsObjects: gates.js,
      governance: gates.governance,
    },
    // Capabilities that EXIST in this server but are not registered under the current configuration. If the user asks
    // for something here (datasources, queries, JS objects, publish, ...), don't say it's impossible — relay each
    // group's 'requires' instruction so they know how to unlock it.
    disabledCapabilities: {
      note:
        disabledGroups.length === 0
          ? "All capability groups are enabled."
          : "Not available under this deployment's configuration. To use one of these, follow the group's 'requires' instruction (ask your Appsmith administrator), then reconnect.",
      groups: disabledGroups,
    },
    governanceNote: gates.governance
      ? "Mutations are locked, revision-checked, and audited; destructive/high-impact operations require a one-time confirmation token. Publish-on-create is automatic (build_application deploys the app it just created, recorded in the audit trail); governance gates RE-publishing existing apps via prepare_publish/confirm_publish."
      : "Governance (Mongo+Redis) is not configured, so governed and destructive tools are not registered. build_application still auto-deploys the app it just created; RE-publishing an existing app after edits requires governance.",
    workflows: {
      available: false,
      note: "CE workflow tools are not available via MCP.",
    },
    gitSync: {
      available: false,
      note: "Git sync is Appsmith platform functionality and is out of MCP scope.",
    },
    resources: [
      "appsmith://reference/widgets — the widget catalog as a resource",
      "appsmith://guide/{placement,naming,bindings} — technique guides",
      "appsmith://recipe/{crud,form,table-detail,zip-lookup} — end-to-end build walkthroughs",
    ],
    prompts: [
      "scaffold_crud — guided workflow to build a CRUD page from an entity + fields",
      "scaffold_form — guided workflow to build a form page",
    ],
  };
}
