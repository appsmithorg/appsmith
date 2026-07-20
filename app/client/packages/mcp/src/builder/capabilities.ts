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
        "{ table: '<tableWidget>', column: '<column>' } — show the selected row's column (detail views); or { query: '<query>', field?: '<path>' } — show one field of a query's response (scalar readout).",
      value:
        "computed value, no query needed: { now: { format: 'dayOfWeek'|'date'|'dateShort'|'time'|'dateTime'|'isoDate'|'monthYear' } } (current date/time), { count: { query, field? } } (row count), { concat: [ { literal }|{ table, column }|{ query, field? }, ... ] }, or { formula: <expr> } for arithmetic — expr is a number, { query, field? }, { table, column }, or { op: 'add'|'sub'|'mul'|'div'|'round'|'abs'|'min'|'max', args: [expr...] } (round takes an optional 0-6 decimals literal; renders blank if non-numeric). Set exactly ONE of text, source, value.",
    },
    purpose:
      "Static text / headings, a bound detail field, or a computed readout (dates, counts, concatenation).",
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
    type: "divider",
    fields: { orientation: "'horizontal' (default) | 'vertical'" },
    purpose: "A visual separator line.",
  },
  {
    type: "progress",
    fields: {
      value: "number 0-100 — percent complete (defaults to 50)",
      infinite: "boolean — a busy/indeterminate bar with no fixed value",
    },
    purpose: "A linear progress bar.",
  },
  {
    type: "circularprogress",
    fields: { value: "number 0-100 — percent complete (defaults to 65)" },
    purpose: "A circular progress indicator.",
  },
  {
    type: "rate",
    fields: {
      max: "integer 1-10 — number of stars (defaults to 5)",
      defaultRate: "number — initial rating",
      allowHalf: "boolean — allow half-star values",
      readOnly: "boolean — display-only, not editable",
    },
    purpose: "A star-rating display/input.",
  },
  {
    type: "iconbutton",
    fields: {
      icon: "kebab-case Blueprint icon name (e.g. 'plus', 'trash')",
      variant: "'PRIMARY' (default) | 'SECONDARY' | 'TERTIARY'",
    },
    purpose: "A compact icon-only button (wire its click with wire_event).",
  },
  {
    type: "currencyinput",
    fields: {
      label: "string caption",
      placeholder: "string shown when empty",
      defaultValue: "number — initial amount",
      decimals: "integer 0-6 — fractional digits (defaults to 0)",
      currencyCode: "3-letter ISO code, e.g. 'USD' (default), 'EUR'",
    },
    purpose: "A currency-formatted number input.",
  },
  {
    type: "phoneinput",
    fields: {
      label: "string caption",
      placeholder: "string shown when empty",
      defaultValue: "string — initial phone number",
      allowFormatting:
        "boolean — auto-format to national format (default true)",
    },
    purpose: "A phone-number input with dial-code prefix.",
  },
  {
    type: "numberslider",
    fields: {
      label: "string caption",
      min: "number — track start (default 0)",
      max: "number — track end (default 100)",
      step: "positive number — increment (default 1)",
      defaultValue: "number — initial position",
    },
    purpose: "A single-value numeric slider.",
  },
  {
    type: "categoryslider",
    fields: {
      label: "string caption",
      options: "{ label, value }[] — ordered category stops (2-50)",
      defaultValue: "string — initial option value (must match an option)",
    },
    purpose: "A slider that snaps between named categories.",
  },
  {
    type: "rangeslider",
    fields: {
      label: "string caption",
      min: "number — track start (default 0)",
      max: "number — track end (default 100)",
      step: "positive number — increment (default 1)",
      defaultStart: "number — initial low handle",
      defaultEnd: "number — initial high handle",
    },
    purpose: "A two-handle slider selecting a numeric range.",
  },
  {
    type: "checkboxgroup",
    fields: {
      label: "string caption",
      options: "{ label, value }[] — the checkboxes (1-200)",
      defaultSelected: "string[] — option values checked on load",
      inline: "boolean — lay out horizontally (default true)",
    },
    purpose: "A group of checkboxes for multi-select.",
  },
  {
    type: "switchgroup",
    fields: {
      label: "string caption",
      options: "{ label, value }[] — the switches (1-200)",
      defaultSelected: "string[] — option values on at load",
      inline: "boolean — lay out horizontally (default true)",
    },
    purpose: "A group of toggle switches for multi-select.",
  },
  {
    type: "menubutton",
    fields: {
      label: "string — the button caption (defaults to 'Open Menu')",
      variant: "'PRIMARY' (default) | 'SECONDARY' | 'TERTIARY'",
      items:
        "{ label }[] — menu entries (1-50); wire clicks later with wire_event",
    },
    purpose: "A button that opens a dropdown menu of items.",
  },
  {
    type: "buttongroup",
    fields: {
      orientation: "'horizontal' (default) | 'vertical'",
      variant: "'PRIMARY' (default) | 'SECONDARY' | 'TERTIARY'",
      buttons:
        "{ label, icon? }[] — the grouped buttons (1-50); icon is a kebab-case Blueprint name; wire clicks later with wire_event",
    },
    purpose: "A row/column of related buttons.",
  },
  {
    type: "camera",
    fields: {
      mode: "'CAMERA' (photo, default) | 'VIDEO' (recording)",
      mirrored: "boolean — mirror the live preview (default true)",
    },
    purpose: "Capture a photo or video from the device camera.",
  },
  {
    type: "audiorecorder",
    fields: {},
    purpose: "Record audio from the device microphone.",
  },
  {
    type: "codescanner",
    fields: {
      label: "string — the scan button/prompt caption",
      scanMode: "'ALWAYS_ON' (default, live) | 'CLICK_TO_SCAN'",
    },
    purpose: "Scan a QR code or barcode with the device camera.",
  },
  {
    type: "map",
    fields: {
      center: "{ lat, long } — initial map center",
      zoom: "number 0-100 — initial zoom (default 50)",
      markers: "{ lat, long, title? }[] — static pins (up to 200)",
      enableSearch: "boolean — show the location search box (default true)",
      allowZoom: "boolean — allow zooming (default true)",
    },
    purpose:
      "An interactive Google map (needs a tenant Google Maps API key configured in admin settings).",
  },
  {
    type: "mapchart",
    fields: {
      title: "string — chart title",
      region:
        "WORLD (default) | WORLD_WITH_ANTARCTICA | EUROPE | NORTH_AMERICA | SOURTH_AMERICA | ASIA | OCEANIA | AFRICA | USA",
      data: "{ id, value, label? }[] — per-region values; id is a region code (e.g. 'NA', 'US-CA')",
    },
    purpose: "A choropleth map colouring regions by value.",
  },
  {
    type: "singleselecttree",
    fields: {
      label: "string caption",
      options:
        "{ label, value, children? }[] — a nested option tree (children recurse)",
      defaultValue: "string — option value selected on load (must match)",
      expandAll: "boolean — expand every branch on load (default false)",
    },
    purpose: "A dropdown that picks one node from a hierarchy.",
  },
  {
    type: "multiselecttree",
    fields: {
      label: "string caption",
      options:
        "{ label, value, children? }[] — a nested option tree (children recurse)",
      defaultSelected: "string[] — option values selected on load",
      expandAll: "boolean — expand every branch on load (default false)",
    },
    purpose: "A dropdown that picks several nodes from a hierarchy.",
  },
  {
    type: "iframe",
    fields: {
      source:
        "required http(s) URL to embed (raw HTML/srcDoc is not supported)",
      title: "string caption shown above the frame",
    },
    purpose: "Embed an external web page.",
  },
  {
    type: "video",
    fields: {
      url: "required http(s) URL to the video",
      autoPlay: "boolean — start playing on load (default false)",
    },
    purpose: "Play a video from a URL.",
  },
  {
    type: "audio",
    fields: {
      url: "required http(s) URL to the audio",
      autoPlay: "boolean — start playing on load (default false)",
    },
    purpose: "Play audio from a URL.",
  },
  {
    type: "documentviewer",
    fields: {
      url: "required http(s) URL to a PDF/DOCX/etc.",
    },
    purpose: "Render a document (PDF, DOCX, ...) from a URL.",
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
    {
      name: "get_guide",
      gate: "always",
      summary:
        "read a built-in guide/recipe/reference doc as markdown by slug (the same content as the appsmith:// resources, for clients that cannot read MCP resources)",
    },
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
    {
      name: "read_git_status",
      gate: "always",
      summary:
        "safe git status projection (branch, clean/dirty + modified-entity counts, protected branches, remote host only; compareRemote opt-in for ahead/behind)",
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
      summary:
        "delete a page with a token; prompts the user for approval via elicitation when the client supports it",
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
      summary:
        "roll back a layout change; prompts the user for approval via elicitation when the client supports it",
    },
    {
      name: "prepare_publish",
      gate: "governance",
      summary: "prepare re-publish of an existing app (confirmation)",
    },
    {
      name: "confirm_publish",
      gate: "governance",
      summary:
        "re-deploy an existing app with a token; prompts the user for approval via elicitation when the client supports it",
    },
    {
      name: "create_branch",
      gate: "governance",
      summary:
        "create an agent git branch under the reserved mcp/ namespace — PUSHES the new ref to the remote and returns the NEW branched applicationId (governed)",
    },
    {
      name: "prepare_commit",
      gate: "governance",
      summary:
        "prepare a git commit on an mcp/ agent branch: one-time confirmation bound to the app, branch, message, and content revision — the commit API always PUSHES to the remote (governed)",
    },
    {
      name: "confirm_commit",
      gate: "governance",
      summary:
        "commit AND PUSH with a confirmation token after a fresh mcp/-branch re-check; prompts the user for approval via elicitation when the client supports it (governed)",
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
      summary:
        "delete an action with a token; prompts the user for approval via elicitation when the client supports it",
    },
    {
      name: "prepare_run_action",
      gate: "data_governance",
      summary: "prepare a confirmed action run",
    },
    {
      name: "confirm_run_action",
      gate: "data_governance",
      summary:
        "run an action with a token; prompts the user for approval via elicitation when the client supports it",
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
      summary:
        "delete a JS object with a token; prompts the user for approval via elicitation when the client supports it",
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
      "governed edits, page create/delete, re-publish of existing apps (new apps auto-deploy on creation), agent git branches (create_branch), git commits on mcp/ branches (prepare_commit/confirm_commit), audit history, rollback",
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
        "{ operations: [{ kind: 'update', name: '<widget>', props: {...} } | { kind: 'move', name, parent?, position?, strict? } | { kind: 'resize', name, rows?, columns?, strict? } | { kind: 'remove', name }] }",
      move: "parent: '<containerWidget>' reparents; position: { topRow, leftColumn } places on the page grid (rows/columns, see `grid`) — set the same topRow as a sibling to sit widgets side by side. At least one of parent/position is required. NOT the build spec's placement { after/inside } — read the page first to learn current positions. Occupancy-aware: a position that lands on another widget is REPAIRED to the nearest free spot below (the change records requestedPosition vs the applied position, and the result carries a note) unless strict: true, which rejects with the colliding widget names and the nearest free position so one retry can succeed. Reparenting always lands at the nearest free spot in the destination canvas and the landing position is recorded in changes (it is no longer carried over blindly). A modal (or a subtree containing one) can never be moved under another modal's canvas — modals are page-level overlays.",
      resize:
        "{ kind: 'resize', name, rows?, columns?, strict? } — set a widget's span in grid units (integers >= 1; at least one of rows/columns). Growing into occupied cells pushes the colliding below-siblings down (strict: true rejects with their names instead); width growth past the canvas is rejected with the available columns; shrinking a container/form/tabs below its children is rejected with the smallest size that fits them. Modals translate rows into their pixel height (rows × grid.rowHeightPx) — modal columns are not resizable.",
      overlapPolicy:
        "Any layout mutation whose result would INTRODUCE overlapping widgets is rejected with code 'overlap_introduced', the offending name pairs, and a ready-to-apply suggestedFix ({ tool: 'patch_widgets', operations: [...] }). Pre-existing overlaps on a page never block edits. Containers/forms/tabs auto-grow to fit new content and push widgets below them down; every automatic adjustment is reported in changes/notes.",
      updateProps: {
        literals:
          "text, label, inputType, options, title, image, chartType, chartName, defaultText, placeholderText, dateFormat, isRequired, isDisabled, isVisible, oddRowColor, evenRowColor, isVisibleSearch, enableClientSideSearch, isVisibleFilters, isSortable, isVisibleDownload, isVisiblePagination",
        tableData:
          "{ query: '<queryName>', field?: '<responsePath>', clearWhenEmpty?: '<inputWidget>' } OR { store: '<storeKey>' } — bind an EXISTING table's rows to a query, or to a store key accumulated by wire_event's appendToStore (session-only). This is the patch-path name for the build spec's `source`; read_semantic_page also reports it as tableData.",
        source:
          "{ table: '<Table>', column: '<col>' } — selected-row display binding on a text widget. NOT the table data binding (use tableData for that).",
        defaultValue:
          "{ table: '<Table>', column: '<col>' } — selected-row prefill on an input widget",
        visibleWhen:
          "{ control: '<widget>', equals: <literal> } | { rowSelected: '<table>' } | { notEmpty: '<input>' }",
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
      ? "Mutations are locked, revision-checked, and audited; destructive/high-impact operations require a one-time confirmation token, and every confirm_* tool prompts the user for approval via elicitation when the client supports it (otherwise show the user the prepare_* relay text and get their approval first — a declined prompt never consumes the token). Publish-on-create is automatic (build_application deploys the app it just created, recorded in the audit trail); governance gates RE-publishing existing apps via prepare_publish/confirm_publish."
      : "Governance (Mongo+Redis) is not configured, so governed and destructive tools are not registered. build_application still auto-deploys the app it just created; RE-publishing an existing app after edits requires governance.",
    workflows: {
      available: false,
      note: "CE workflow tools are not available via MCP.",
    },
    gitSync: {
      available: true,
      note: "read_git_status (always on) reads a safe git status projection. Every mutation on a git-connected app REQUIRES a 'branch' parameter equal to the target app's current branch (fail-closed; the error carries the current branch). create_branch (governed) creates an agent branch under the reserved mcp/ namespace — it PUSHES the new ref to the remote and returns the NEW branched applicationId to edit (branch-per-application; no checkout). prepare_commit/confirm_commit (governed) commit AND PUSH — allowed ONLY on mcp/ agent branches (verified by a fresh read at confirm time), with the user's approval (an elicitation prompt when the client supports it; otherwise you must relay the prepare_commit text and get approval first). Publishing from MCP stays disabled for git apps: the deliverable is the mcp/ branch + its review URL, which the user merges via Appsmith's branch UI or a PR on the remote. See appsmith://guide/git.",
    },
    resources: [
      "appsmith://reference/widgets — the widget catalog as a resource",
      "appsmith://guide/{placement,naming,bindings,git} — technique guides",
      "appsmith://recipe/{crud,form,table-detail,zip-lookup} — end-to-end build walkthroughs",
      "Every doc above is also readable through the get_guide tool by slug (for clients that cannot read MCP resources).",
    ],
    prompts: [
      "scaffold_crud — guided workflow to build a CRUD page from an entity + fields",
      "scaffold_form — guided workflow to build a form page",
    ],
  };
}
