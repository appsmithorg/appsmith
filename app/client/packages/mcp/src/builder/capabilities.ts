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
    fields: { text: "plain string (no binding/template syntax)" },
    purpose: "Static text / headings.",
  },
  {
    type: "input",
    fields: {
      label: "string",
      inputType: "TEXT | NUMBER | EMAIL | PASSWORD",
    },
    purpose: "Single-line text entry.",
  },
  {
    type: "select",
    fields: {
      label: "string",
      options: "{ label: string, value: string|number }[]",
    },
    purpose: "Dropdown selection.",
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
      source: "{ query: '<queryName>' } — bind to a query's data (data layer)",
    },
    purpose:
      "Tabular data with search/sort/pagination. Use `data` for static rows OR `source` to bind a query (not both).",
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
    type: "chart",
    fields: {
      title: "string",
      chartType:
        "LINE_CHART | BAR_CHART | PIE_CHART | COLUMN_CHART | AREA_CHART",
      series: "{ name?: string, points?: { x, y }[] }[] — static series",
    },
    purpose: "Visualize static series data.",
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
    fields: { children: "widget spec[] (the repeating item template)" },
    purpose: "Repeat a template of widgets over a list of items.",
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
      summary: "list accessible workspaces",
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
      summary: "create an app from a spec",
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
      summary: "wire a widget event to a safe action",
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
      summary: "prepare publish (confirmation)",
    },
    {
      name: "confirm_publish",
      gate: "governance",
      summary: "deploy with a token",
    },
    // Data layer (APPSMITH_MCP_DATA_ENABLED).
    { name: "list_datasources", gate: "data", summary: "discover datasources" },
    {
      name: "get_datasource_structure",
      gate: "data",
      summary: "datasource tables/columns",
    },
    { name: "list_actions", gate: "data", summary: "safe action metadata" },
    { name: "create_query", gate: "data", summary: "structured SQL query" },
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

export function getCapabilities(
  gates: CapabilityGates = { data: false, js: false, governance: false },
) {
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
    governanceNote: gates.governance
      ? "Mutations are locked, revision-checked, and audited; destructive/high-impact operations require a one-time confirmation token."
      : "Governance (Mongo+Redis) is not configured, so governed and destructive tools are not registered.",
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
      "appsmith://recipe/{crud,form,table-detail} — end-to-end build walkthroughs",
    ],
    prompts: [
      "scaffold_crud — guided workflow to build a CRUD page from an entity + fields",
      "scaffold_form — guided workflow to build a form page",
    ],
  };
}
