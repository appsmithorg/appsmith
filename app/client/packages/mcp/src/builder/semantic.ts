import { createHash } from "node:crypto";
import type { WidgetNode } from "./layout.js";
import type { WidgetType } from "./schema.js";

const CATALOG_TYPE_BY_APPSMITH_TYPE: Record<string, WidgetType> = {
  TEXT_WIDGET: "text",
  INPUT_WIDGET_V2: "input",
  SELECT_WIDGET: "select",
  BUTTON_WIDGET: "button",
  IMAGE_WIDGET: "image",
  TABLE_WIDGET_V2: "table",
  CONTAINER_WIDGET: "container",
  FORM_WIDGET: "form",
  MODAL_WIDGET: "modal",
  DATE_PICKER_WIDGET2: "datepicker",
  CHART_WIDGET: "chart",
  TABS_WIDGET: "tabs",
  LIST_WIDGET_V2: "list",
};

const SAFE_PROP_KEYS = [
  "text",
  "label",
  "inputType",
  "options",
  "title",
  "image",
  "chartType",
  "chartName",
  "defaultText",
  "placeholderText",
  "dateFormat",
  "isRequired",
  "isDisabled",
  "isVisible",
] as const;

type SafeCommonProp = (typeof SAFE_PROP_KEYS)[number];
type SafePropValue = string | number | boolean | null | SafeOption[];

export interface SafeOption {
  label: string;
  value: string | number | boolean | null;
}

export interface SemanticGeometry {
  topRow: number;
  bottomRow: number;
  leftColumn: number;
  rightColumn: number;
}

// A structured, safe reflection of a COMPILER-EMITTED binding, recovered from the DSL so the read path round-trips
// what the write path created (an agent can see "this text shows Users.email" without ever seeing raw expressions).
export interface SemanticBindingRef {
  table?: string;
  column?: string;
  query?: string;
  field?: string;
  // Present on a guarded table binding: the input whose emptiness clears the table.
  clearWhenEmpty?: string;
}

export interface SemanticWidget {
  id: string;
  name: string;
  appsmithType: string;
  catalogType?: WidgetType;
  parentWidgetName?: string;
  geometry: SemanticGeometry;
  props: Partial<Record<SafeCommonProp, SafePropValue>>;
  bindings?: Record<string, SemanticBindingRef>;
}

export interface SemanticPage {
  widgets: SemanticWidget[];
}

function containsBindingSyntax(value: string): boolean {
  return /\{\{|\}\}|\$\{|`/.test(value);
}

function safeScalar(
  value: unknown,
): string | number | boolean | null | undefined {
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return typeof value === "string" && !containsBindingSyntax(value)
    ? value
    : undefined;
}

function safeOptions(value: unknown): SafeOption[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const options: SafeOption[] = [];

  for (const option of value) {
    if (!isRecord(option) || typeof option.label !== "string") return undefined;

    const safeValue = safeScalar(option.value);

    if (containsBindingSyntax(option.label) || safeValue === undefined) {
      return undefined;
    }

    options.push({ label: option.label, value: safeValue });
  }

  return options;
}

function safeProps(node: WidgetNode): SemanticWidget["props"] {
  const props: SemanticWidget["props"] = {};

  for (const key of SAFE_PROP_KEYS) {
    const value = node[key];
    const safeValue =
      key === "options" ? safeOptions(value) : safeScalar(value);

    if (safeValue !== undefined) props[key] = safeValue;
  }

  return props;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Exact shapes the compilers emit — and ONLY those. Anything else (human-authored or arbitrary expressions) stays
// hidden, preserving the projection's no-raw-bindings guarantee.
const SELECTED_ROW_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.selectedRow\["([A-Za-z0-9_ ]+)"\] \}\}$/;
// Matches the compiler's table-source binding: `{{ Query.data ?? [] }}` or `{{ Query.data?.field ?? [] }}`.
const QUERY_DATA_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.data(?:\?\.([A-Za-z0-9_.]+))? \?\? \[\] \}\}$/;
// The guarded (clear-when-empty) variant: `{{ Input.text ? (Query.data?.field ?? []) : [] }}`.
const GUARDED_QUERY_DATA_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.text \? \(([A-Za-z0-9_]+)\.data(?:\?\.([A-Za-z0-9_.]+))? \?\? \[\]\) : \[\] \}\}$/;

function safeBindings(
  node: WidgetNode,
): Record<string, SemanticBindingRef> | undefined {
  const bindings: Record<string, SemanticBindingRef> = {};

  for (const key of ["text", "defaultText"] as const) {
    const value = node[key];

    if (typeof value !== "string") continue;

    const match = SELECTED_ROW_BINDING.exec(value);

    if (match) bindings[key] = { table: match[1], column: match[2] };
  }

  if (typeof node.tableData === "string") {
    const guarded = GUARDED_QUERY_DATA_BINDING.exec(node.tableData);

    if (guarded) {
      bindings.tableData = {
        query: guarded[2],
        ...(guarded[3] ? { field: guarded[3] } : {}),
        clearWhenEmpty: guarded[1],
      };
    } else {
      const match = QUERY_DATA_BINDING.exec(node.tableData);

      if (match) {
        bindings.tableData = match[2]
          ? { query: match[1], field: match[2] }
          : { query: match[1] };
      }
    }
  }

  return Object.keys(bindings).length > 0 ? bindings : undefined;
}

function semanticGeometry(node: WidgetNode): SemanticGeometry {
  return {
    topRow: node.topRow,
    bottomRow: node.bottomRow,
    leftColumn: node.leftColumn,
    rightColumn: node.rightColumn,
  };
}

// Produces a compact, flattened view of a page DSL. It intentionally excludes bindings, events, and every prop
// outside SAFE_PROP_KEYS, so it can be supplied to an agent without revealing arbitrary page configuration.
export function projectSemanticPage(dsl: WidgetNode): SemanticPage {
  const widgets: SemanticWidget[] = [];

  function visit(node: WidgetNode, parentWidgetName?: string): void {
    const catalogType = CATALOG_TYPE_BY_APPSMITH_TYPE[node.type];
    const bindings = safeBindings(node);

    widgets.push({
      id: node.widgetId,
      name: node.widgetName,
      appsmithType: node.type,
      ...(catalogType !== undefined ? { catalogType } : {}),
      ...(parentWidgetName !== undefined ? { parentWidgetName } : {}),
      geometry: semanticGeometry(node),
      props: safeProps(node),
      ...(bindings !== undefined ? { bindings } : {}),
    });

    for (const child of node.children ?? []) visit(child, node.widgetName);
  }

  visit(dsl);

  return { widgets };
}

// JSON-compatible values only: object keys are sorted recursively, while undefined object members are omitted to
// match JSON.stringify semantics. This makes fingerprints independent of source property insertion order.
export function canonicalStableSerialize(value: unknown): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new TypeError("canonical serialization requires finite numbers");
      }

      return JSON.stringify(value);
    case "string":
      return JSON.stringify(value);
    case "undefined":
      return "null";
    case "object":
      if (Array.isArray(value)) {
        return `[${value.map(canonicalStableSerialize).join(",")}]`;
      }

      if (!isRecord(value)) {
        throw new TypeError(
          "canonical serialization requires plain JSON objects",
        );
      }

      return `{${Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${canonicalStableSerialize(value[key])}`,
        )
        .join(",")}}`;
    default:
      throw new TypeError(
        "canonical serialization requires JSON-compatible values",
      );
  }
}

export function fingerprintDsl(dsl: WidgetNode): string {
  return createHash("sha256")
    .update(canonicalStableSerialize(dsl), "utf8")
    .digest("hex");
}
