import { createHash } from "node:crypto";
import { tabLabelsOf, type WidgetNode } from "./layout.js";
import { COMPUTED_NOW_FORMATS, type WidgetType } from "./schema.js";

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
  CHECKBOX_WIDGET: "checkbox",
  SWITCH_WIDGET: "switch",
  RADIO_GROUP_WIDGET: "radio",
  MULTI_SELECT_WIDGET_V2: "multiselect",
  FILE_PICKER_WIDGET_V2: "filepicker",
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
  // Validation reads back as the compiled literal regex + message (the named `format` isn't persisted, so there is
  // no reverse structured ref). safeScalar still hides any value carrying binding syntax.
  "regex",
  "errorMessage",
  // Caption + inert default-state literals (labelText is the select/multiselect caption; the other form controls
  // use label above). safeValue still hides anything carrying binding syntax.
  "labelText",
  "defaultCheckedState",
  "defaultSwitchState",
  "defaultOptionValue",
  // Widget-property audit (APP-16052): every remaining property-pane literal patch_widgets can write, so the read
  // and patch vocabularies agree. Lists (defaultSelectedRowIndices, allowedFileTypes, a multiselect default) and
  // flat records (defaultNewRow) project only when every element is a safe scalar.
  "defaultSelectedRowIndex",
  "defaultSelectedRowIndices",
  "multiRowSelection",
  "primaryColumnId",
  "serverSidePaginationEnabled",
  "infiniteScrollEnabled",
  "enableServerSideFiltering",
  "defaultSearchText",
  "allowAddNewRow",
  "defaultNewRow",
  "canFreezeColumn",
  "delimiter",
  "inlineEditingSaveOption",
  "compactMode",
  "textSize",
  "horizontalAlignment",
  "verticalAlignment",
  "cellBackground",
  "headerRowColor",
  "headerTextColor",
  "oddRowColor",
  "evenRowColor",
  "variant",
  "isVisibleSearch",
  "enableClientSideSearch",
  "isVisibleFilters",
  "isSortable",
  "isVisibleDownload",
  "isVisiblePagination",
  "overflow",
  "fontFamily",
  "fontSize",
  "textAlign",
  "fontStyle",
  "disableLink",
  "textColor",
  "backgroundColor",
  "truncateButtonColor",
  "borderColor",
  "borderWidth",
  "borderRadius",
  "boxShadow",
  "accentColor",
  "buttonColor",
  "animateLoading",
  "labelPosition",
  "labelAlignment",
  "alignWidget",
  "alignment",
  "labelWidth",
  "labelTooltip",
  "tooltip",
  "labelTextColor",
  "labelTextSize",
  "labelStyle",
  "maxChars",
  "minNum",
  "maxNum",
  "rtl",
  "iconName",
  "iconAlign",
  "isSpellCheck",
  "showStepArrows",
  "autoFocus",
  "shouldAllowAutofill",
  "allowFormatting",
  "resetOnSubmit",
  "isFilterable",
  "serverSideFiltering",
  "allowSelectAll",
  "buttonVariant",
  "placement",
  "disabledWhenInvalid",
  "resetFormOnClick",
  "defaultImage",
  "objectFit",
  "maxZoomLevel",
  "enableRotation",
  "enableDownload",
  "shouldScrollContents",
  "canOutsideClickClose",
  "shouldShowTabs",
  "defaultTab",
  // Keyboard focus order (platform-level Accessibility > Tab order); absent means automatic order.
  "tabOrder",
  "itemSpacing",
  "serverSidePagination",
  "defaultSelectedItem",
  "defaultDate",
  "minDate",
  "maxDate",
  "firstDayOfWeek",
  "timePrecision",
  "shortcuts",
  "closeOnSelection",
  "seriesName",
  "xAxisName",
  "yAxisName",
  "allowScroll",
  "showDataPointLabel",
  "setAdaptiveYMin",
  "labelOrientation",
  "isInline",
  "allowedFileTypes",
  "fileDataType",
  "dynamicTyping",
  "maxNumFiles",
  "maxFileSize",
] as const;

type SafeCommonProp = (typeof SAFE_PROP_KEYS)[number];
// Computed on read, never a node prop: a Tabs widget's tab labels in display order (from tabsObj indices, hidden
// tabs included), so an agent can `reorderTabs` or pick a `defaultTab` that exists.
type ComputedProp = "tabs";
type SafeScalar = string | number | boolean | null;
type SafePropValue =
  | SafeScalar
  | SafeOption[]
  | SafeScalar[]
  | Record<string, SafeScalar>;

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
  // Present on an isDisabled binding: the input whose invalidity disables this widget.
  disableWhenInvalid?: string;
  // Present on an isVisible binding: the control + value this widget's visibility is gated on — or the table
  // whose row selection, or the input whose non-emptiness, gates it.
  control?: string;
  equals?: string;
  rowSelected?: string;
  notEmpty?: string;
  // Present on computed text values: the current-date preset, or the row count of a query.
  now?: { format: string };
  count?: { query: string; field?: string };
}

export interface SemanticWidget {
  id: string;
  name: string;
  appsmithType: string;
  catalogType?: WidgetType;
  parentWidgetName?: string;
  geometry: SemanticGeometry;
  props: Partial<Record<SafeCommonProp | ComputedProp, SafePropValue>>;
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

// A list of safe scalars (a table's default row indices, a file picker's allowed types, a multiselect default).
function safeList(value: unknown): SafeScalar[] | undefined {
  if (!Array.isArray(value) || value.length > 1_000) return undefined;

  const list: SafeScalar[] = [];

  for (const item of value) {
    const safeItem = safeScalar(item);

    if (safeItem === undefined) return undefined;

    list.push(safeItem);
  }

  return list;
}

// A flat record of safe scalars (a table's defaultNewRow). Keys carrying binding syntax hide the whole record.
function safeRecord(value: unknown): Record<string, SafeScalar> | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value);

  if (entries.length > 100) return undefined;

  const record: Record<string, SafeScalar> = {};

  for (const [key, item] of entries) {
    const safeItem = safeScalar(item);

    if (containsBindingSyntax(key) || safeItem === undefined) return undefined;

    record[key] = safeItem;
  }

  return record;
}

function safeValue(
  key: SafeCommonProp,
  value: unknown,
): SafePropValue | undefined {
  if (key === "options") return safeOptions(value);

  if (Array.isArray(value)) return safeList(value);

  if (isRecord(value)) return safeRecord(value);

  return safeScalar(value);
}

function safeProps(node: WidgetNode): SemanticWidget["props"] {
  const props: SemanticWidget["props"] = {};

  for (const key of SAFE_PROP_KEYS) {
    const value = safeValue(key, node[key]);

    if (value !== undefined) props[key] = value;
  }

  if (node.type === "TABS_WIDGET") {
    const tabs = safeList(tabLabelsOf(node));

    if (tabs !== undefined && tabs.length > 0) props.tabs = tabs;
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
// Matches the compiler's scalar query-field binding: `{{ Query.data ?? "" }}` / `{{ Query.data?.field ?? "" }}`.
const QUERY_FIELD_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.data(?:\?\.([A-Za-z0-9_.]+))? \?\? "" \}\}$/;
// The computed `now` binding: `{{ moment().format('dddd') }}` — reported only when the format literal reverse-maps
// to a named preset (anything else is not compiler-emitted and stays hidden).
const NOW_BINDING = /^\{\{ moment\(\)\.format\('([A-Za-z0-9\-:,/ ]+)'\) \}\}$/;
// The computed `count` binding: `{{ (Query.data?.field ?? []).length }}`.
const COUNT_BINDING =
  /^\{\{ \(([A-Za-z0-9_]+)\.data(?:\?\.([A-Za-z0-9_.]+))? \?\? \[\]\)\.length \}\}$/;

// Reverse map from moment format literal to its preset name, derived from the emitter's map so they cannot drift.
const NOW_FORMAT_NAMES = new Map<string, string>(
  Object.entries(COMPUTED_NOW_FORMATS).map(([name, format]) => [format, name]),
);
// Matches the compiler's table-source binding: `{{ Query.data ?? [] }}` or `{{ Query.data?.field ?? [] }}`.
const QUERY_DATA_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.data(?:\?\.([A-Za-z0-9_.]+))? \?\? \[\] \}\}$/;
// The guarded (clear-when-empty) variant: `{{ Input.text ? (Query.data?.field ?? []) : [] }}`.
const GUARDED_QUERY_DATA_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.text \? \(([A-Za-z0-9_]+)\.data(?:\?\.([A-Za-z0-9_.]+))? \?\? \[\]\) : \[\] \}\}$/;
// The disable-when-invalid binding: `{{ !Input.isValid }}`.
const DISABLE_WHEN_INVALID_BINDING = /^\{\{ !([A-Za-z0-9_]+)\.isValid \}\}$/;
// The visible-when binding: `{{ Control.selectedOptionValue === 'value' }}` / `{{ Control.selectedTab === 'value' }}`.
const VISIBLE_WHEN_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.(?:selectedOptionValue|selectedTab) === '([A-Za-z0-9_ .-]+)' \}\}$/;
// The row-selection visibility predicate: `{{ Table.selectedRowIndex !== -1 }}`.
const ROW_SELECTED_BINDING =
  /^\{\{ ([A-Za-z0-9_]+)\.selectedRowIndex !== -1 \}\}$/;
// The non-empty-input visibility predicate: `{{ !!Input.text }}`.
const NOT_EMPTY_BINDING = /^\{\{ !!([A-Za-z0-9_]+)\.text \}\}$/;

function safeBindings(
  node: WidgetNode,
): Record<string, SemanticBindingRef> | undefined {
  const bindings: Record<string, SemanticBindingRef> = {};

  for (const key of ["text", "defaultText", "image"] as const) {
    const value = node[key];

    if (typeof value !== "string") continue;

    const match = SELECTED_ROW_BINDING.exec(value);

    if (match) {
      bindings[key] = { table: match[1], column: match[2] };
      continue;
    }

    const queryField = QUERY_FIELD_BINDING.exec(value);

    if (queryField) {
      bindings[key] = queryField[2]
        ? { query: queryField[1], field: queryField[2] }
        : { query: queryField[1] };
      continue;
    }

    if (key !== "text") continue;

    const now = NOW_BINDING.exec(value);
    const nowFormatName = now ? NOW_FORMAT_NAMES.get(now[1]) : undefined;

    if (nowFormatName !== undefined) {
      bindings[key] = { now: { format: nowFormatName } };
      continue;
    }

    const count = COUNT_BINDING.exec(value);

    if (count) {
      bindings[key] = {
        count: count[2]
          ? { query: count[1], field: count[2] }
          : { query: count[1] },
      };
    }
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

  if (typeof node.isDisabled === "string") {
    const match = DISABLE_WHEN_INVALID_BINDING.exec(node.isDisabled);

    if (match) bindings.isDisabled = { disableWhenInvalid: match[1] };
  }

  if (typeof node.isVisible === "string") {
    const match = VISIBLE_WHEN_BINDING.exec(node.isVisible);
    const rowSelected = ROW_SELECTED_BINDING.exec(node.isVisible);
    const notEmpty = NOT_EMPTY_BINDING.exec(node.isVisible);

    if (match) {
      bindings.isVisible = { control: match[1], equals: match[2] };
    } else if (rowSelected) {
      bindings.isVisible = { rowSelected: rowSelected[1] };
    } else if (notEmpty) {
      bindings.isVisible = { notEmpty: notEmpty[1] };
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
