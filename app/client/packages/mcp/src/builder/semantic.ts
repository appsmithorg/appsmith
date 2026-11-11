import { createHash } from "node:crypto";
import { GRID_COLUMNS, tabEntriesOf, type WidgetNode } from "./layout.js";
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
type ComputedProp = "tabs" | "tabsHidden";
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
  // Present on an isDisabled binding: the input (or, for the list form, the controls) whose invalidity disables
  // this widget.
  disableWhenInvalid?: string | string[];
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

// One column of a table (APP-16381), for patch_widgets updateColumn and wire_event `column`. The computed-value
// binding is never returned. A label holding binding syntax is left out.
export interface SemanticColumn {
  id: string;
  key?: string;
  label?: string;
  type?: string;
  visible: boolean;
  order: number;
}

// What a binding the projection cannot read back refers to (APP-16381): only names that match a widget on the page,
// a query or a JS object of the application, and the fields of the signed-in user it reads. Never expression text.
export interface SemanticBoundProp {
  queries?: string[];
  jsObjects?: string[];
  widgets?: string[];
  user?: string[];
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
  columns?: SemanticColumn[];
  boundProps?: Record<string, SemanticBoundProp>;
}

export interface SemanticNames {
  queries?: readonly string[];
  jsObjects?: readonly string[];
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
    const entries = tabEntriesOf(node);
    const tabs = safeList(entries.map((tab) => tab.label));

    if (tabs !== undefined && tabs.length > 0) {
      props.tabs = tabs;

      // Hidden tabs are still part of the order (reorderTabs must list them) but the viewer never shows them.
      const hidden = entries
        .filter((tab) => tab.isVisible === false)
        .map((tab) => tab.label);

      if (hidden.length > 0) props.tabsHidden = hidden;
    }
  }

  // The editor stores tabOrder as a number; a numeric string in a saved DSL is accepted by the client at runtime
  // but would not round-trip through the patch schema, so it reads back as the number it means.
  if (
    typeof props.tabOrder === "string" &&
    /^[1-9][0-9]*$/.test(props.tabOrder)
  ) {
    props.tabOrder = Number(props.tabOrder);
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
// The disable-when-invalid binding: `{{ !Input.isValid }}`, or a list `{{ !A.isValid || !B.isValid }}`.
const DISABLE_WHEN_INVALID_BINDING = /^\{\{ !([A-Za-z0-9_]+)\.isValid \}\}$/;
const DISABLE_WHEN_INVALID_LIST_BINDING =
  /^\{\{ ![A-Za-z0-9_]+\.isValid(?: \|\| ![A-Za-z0-9_]+\.isValid){1,9} \}\}$/;
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

    if (match) {
      bindings.isDisabled = { disableWhenInvalid: match[1] };
    } else if (DISABLE_WHEN_INVALID_LIST_BINDING.test(node.isDisabled)) {
      bindings.isDisabled = {
        disableWhenInvalid: [
          ...node.isDisabled.matchAll(/!([A-Za-z0-9_]+)\.isValid/g),
        ].map((m) => m[1]),
      };
    }
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

function semanticGeometry(node: WidgetNode, isRoot: boolean): SemanticGeometry {
  // An inner canvas's stored rightColumn is the pixel width the client last rendered (or a stale span from an
  // earlier MCP build), never the grid its children use: every canvas is 64 columns wide to its children, so that
  // is what an agent should see and lay out against. The page root keeps its stored geometry.
  if (node.type === "CANVAS_WIDGET" && !isRoot) {
    return {
      topRow: node.topRow,
      bottomRow: node.bottomRow,
      leftColumn: 0,
      rightColumn: GRID_COLUMNS,
    };
  }

  return {
    topRow: node.topRow,
    bottomRow: node.bottomRow,
    leftColumn: node.leftColumn,
    rightColumn: node.rightColumn,
  };
}

const MAX_COLUMNS = 200;

// A table's columns in display order (columnOrder first, then any others by index).
function semanticColumns(node: WidgetNode): SemanticColumn[] | undefined {
  if (node.type !== "TABLE_WIDGET_V2" || !isRecord(node.primaryColumns)) {
    return undefined;
  }

  const columns = node.primaryColumns;
  const ids = new Set(
    Object.keys(columns)
      .slice(0, MAX_COLUMNS * 5)
      .filter(
        (id) => /^[A-Za-z0-9_]{1,100}$/.test(id) && isRecord(columns[id]),
      ),
  );
  const order = [
    ...new Set(
      Array.isArray(node.columnOrder)
        ? (node.columnOrder as unknown[]).filter(
            (id): id is string => typeof id === "string" && ids.has(id),
          )
        : [],
    ),
  ];
  const ordered = new Set(order);
  const rest = [...ids]
    .filter((id) => !ordered.has(id))
    .sort(
      (a, b) =>
        Number((columns[a] as Record<string, unknown>).index ?? 0) -
        Number((columns[b] as Record<string, unknown>).index ?? 0),
    );

  return [...order, ...rest].slice(0, MAX_COLUMNS).map((id, index) => {
    const column = columns[id] as Record<string, unknown>;
    const key = safeScalar(column.originalId);
    const label = safeScalar(column.label);
    const type = safeScalar(column.columnType);

    return {
      id,
      ...(typeof key === "string" ? { key } : {}),
      ...(typeof label === "string" ? { label } : {}),
      ...(typeof type === "string" ? { type } : {}),
      visible: column.isVisible !== false,
      order: index,
    };
  });
}

const MAX_SUMMARY_SCAN = 20_000;
const MAX_SUMMARY_PROPS = 100;
const SUMMARY_PROP_KEY = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
const USER_FIELD_READ =
  /appsmith\.user\.(name|email|username)(?![A-Za-z0-9_$])/g;
const NAME_READ =
  /(?:^|[^A-Za-z0-9_.$])([A-Za-z_$][A-Za-z0-9_$]{0,63})(?=\s*[.([])/g;

// For each top-level prop holding a binding that `bindings` does not describe: the known names it refers to.
function boundPropSummary(
  node: WidgetNode,
  described: Record<string, SemanticBindingRef> | undefined,
  widgetNames: ReadonlySet<string>,
  queries: ReadonlySet<string>,
  jsObjects: ReadonlySet<string>,
): Record<string, SemanticBoundProp> | undefined {
  const summary: Record<string, SemanticBoundProp> = Object.create(null);
  let count = 0;

  for (const [key, value] of Object.entries(node)) {
    if (count >= MAX_SUMMARY_PROPS) break;

    if (
      typeof value !== "string" ||
      !value.includes("{{") ||
      !SUMMARY_PROP_KEY.test(key) ||
      key === "children" ||
      described?.[key] !== undefined
    ) {
      continue;
    }

    const text = value.slice(0, MAX_SUMMARY_SCAN);
    const found: Record<keyof SemanticBoundProp, Set<string>> = {
      queries: new Set(),
      jsObjects: new Set(),
      widgets: new Set(),
      user: new Set(),
    };

    for (const match of text.matchAll(NAME_READ)) {
      const name = match[1];

      if (queries.has(name)) found.queries.add(name);
      else if (jsObjects.has(name)) found.jsObjects.add(name);
      else if (widgetNames.has(name) && name !== node.widgetName) {
        found.widgets.add(name);
      }
    }

    for (const match of text.matchAll(USER_FIELD_READ)) {
      found.user.add(match[1]);
    }

    const entry: SemanticBoundProp = {};

    for (const field of ["queries", "jsObjects", "widgets", "user"] as const) {
      if (found[field].size > 0) entry[field] = [...found[field]].sort();
    }

    summary[key] = entry;
    count += 1;
  }

  return count > 0 ? { ...summary } : undefined;
}

function widgetNamesOf(dsl: WidgetNode): Set<string> {
  const names = new Set<string>();
  const stack = [dsl];

  while (stack.length > 0) {
    const node = stack.pop() as WidgetNode;

    names.add(node.widgetName);
    stack.push(...(node.children ?? []));
  }

  return names;
}

// Produces a compact, flattened view of a page DSL. It intentionally excludes bindings, events, and every prop
// outside SAFE_PROP_KEYS, so it can be supplied to an agent without revealing arbitrary page configuration.
export function projectSemanticPage(
  dsl: WidgetNode,
  names: SemanticNames = {},
): SemanticPage {
  const widgets: SemanticWidget[] = [];
  const widgetNames = widgetNamesOf(dsl);
  const queries = new Set(names.queries ?? []);
  const jsObjects = new Set(names.jsObjects ?? []);

  function visit(node: WidgetNode, parentWidgetName?: string): void {
    const catalogType = CATALOG_TYPE_BY_APPSMITH_TYPE[node.type];
    const bindings = safeBindings(node);
    const columns = semanticColumns(node);
    const boundProps = boundPropSummary(
      node,
      bindings,
      widgetNames,
      queries,
      jsObjects,
    );

    widgets.push({
      id: node.widgetId,
      name: node.widgetName,
      appsmithType: node.type,
      ...(catalogType !== undefined ? { catalogType } : {}),
      ...(parentWidgetName !== undefined ? { parentWidgetName } : {}),
      geometry: semanticGeometry(node, parentWidgetName === undefined),
      props: safeProps(node),
      ...(bindings !== undefined ? { bindings } : {}),
      ...(columns !== undefined ? { columns } : {}),
      ...(boundProps !== undefined ? { boundProps } : {}),
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
