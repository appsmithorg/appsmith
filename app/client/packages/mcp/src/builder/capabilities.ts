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

export function getCapabilities() {
  return {
    description:
      "Build Appsmith apps from a high-level page spec. The MCP layer auto-places widgets on a 64-column grid and " +
      "compiles to a real Appsmith artifact imported via the ACL-enforced API. You never author raw widget DSL.",
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
    tools: [
      "get_capabilities — this catalog",
      "list_presets / get_preset — ready page specs to adapt",
      "validate_app_spec — dry-run compile; returns errors, imports nothing",
      "build_application — compile an app spec and create the app",
      "edit_page — append widgets to an existing page (best-effort placement)",
      "inspect_page — lint a live page and return structural diagnostics",
    ],
    dataTools: [
      "list_datasources / get_datasource_structure — discover what to query (data layer)",
      "create_query — build a SELECT/INSERT/UPDATE/DELETE query from a structured spec (data layer)",
    ],
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
