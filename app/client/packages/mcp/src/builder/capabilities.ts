import { GRID_COLUMNS, ROW_HEIGHT } from "./layout.js";
import { listPresets } from "./presets.js";

// A machine-readable catalog so the caller's agent can discover what it can build and how to shape a page spec,
// without reading source or guessing.

const WIDGET_CATALOG = [
  {
    type: "text",
    fields: { text: "string" },
    purpose: "Static or bound text / headings.",
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
  { type: "button", fields: { text: "string" }, purpose: "Trigger an action." },
  {
    type: "image",
    fields: { image: "string (url or {{binding}})" },
    purpose: "Display an image.",
  },
  {
    type: "table",
    fields: { data: "string (JSON array or {{query.data}} binding)" },
    purpose: "Tabular data with search/sort/pagination.",
  },
  {
    type: "container",
    fields: { children: "widget spec[]" },
    purpose: "Group widgets into a card; nest other widgets inside.",
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
    ],
  };
}
