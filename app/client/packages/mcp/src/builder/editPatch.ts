import { z } from "zod";
import {
  ROOT_WIDGET_ID,
  ROW_HEIGHT,
  tabEntriesOf,
  tabLabelsOf,
  type WidgetNode,
} from "./layout.js";
import {
  applyPosition,
  canvasColumns,
  cascadeFit,
  clampRow,
  collisions,
  contentExtent,
  isDetached,
  isNumber,
  MAX_ROW,
  nearestFreePosition,
  rectOf,
  syncMobileRows,
  type CascadeAdjustment,
  type Position,
  type Rect,
} from "./occupancy.js";
import { containsModal, hostModalOf, PAGE_HOST } from "./modalGraph.js";
import {
  compileDisableWhenInvalid,
  compileInputValidation,
  compileComputedValue,
  compileQueryFieldBinding,
  compileSelectedRowBinding,
  computedValueSchema,
  computedValueTableRefs,
  compileTableDataBinding,
  compileNotEmptyBinding,
  compileRowSelectedBinding,
  compileVisibleWhenBinding,
  cssColor,
  entityPropertyPath,
  imageUrl,
  inputValidationSchema,
  isoDateLiteral,
  queryFieldRefSchema,
  selectedRowRefSchema,
  tableColumnName,
  tableDataBindingSchema,
  visibleWhenRefSchema,
  type InputValidationRef,
  type QueryFieldRef,
  type SelectedRowRef,
  type TableDataBinding,
  type VisibleWhenRef,
  RAW_EXPRESSION,
} from "./schema.js";

// Mirrors schema.ts RAW_EXPRESSION, including U+2028/U+2029 line/paragraph separators that JSON.stringify leaves
// unescaped and that terminate a JS string literal on pre-ES2019 engines.
const MAX_WIDGET_NAME_LENGTH = 64;

const widgetNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_WIDGET_NAME_LENGTH)
  .regex(/^[A-Za-z0-9_]+$/, "must be alphanumeric/underscore");

const safeText = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (value) => !RAW_EXPRESSION.test(value),
      "must not contain bindings",
    );

// cssColor (the literal color-grammar allowlist — hex/rgb/hsl/named only, no url()/binding) is shared from schema.ts
// so the build and patch surfaces validate colors identically.

const literalScalarSchema = z.union([
  safeText(10_000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const optionSchema = z
  .object({
    label: safeText(200).pipe(z.string().min(1)),
    value: literalScalarSchema,
  })
  .strict();

// ---------------------------------------------------------------------------------------------------------------
// Property-pane literals (APP-16052 widget-property audit). Every entry is a closed literal copied from the widget's
// own property pane: an enum, a bounded number, a color under the shared cssColor grammar, an ISO date, or safeText.
// None is ever compiled into a binding, and each family-specific key is checked against the widget's real type at
// apply time (LITERAL_PROP_OWNERS), so a mismatch is an error rather than a silently dead property.

export const LABEL_POSITIONS = ["Auto", "Top", "Left", "Right"] as const;
export const FONT_SIZES = [
  "0.875rem",
  "1rem",
  "1.25rem",
  "1.875rem",
  "3rem",
  "3.75rem",
] as const;
export const TABLE_TEXT_SIZES = [
  "0.875rem",
  "1rem",
  "1.25rem",
  "1.875rem",
] as const;
export const FONT_FAMILIES = [
  "System Default",
  "Nunito Sans",
  "Poppins",
  "Inter",
  "Montserrat",
  "Noto Sans",
  "Open Sans",
  "Roboto",
  "Rubik",
  "Ubuntu",
] as const;
export const FILE_TYPES = [
  "*",
  "image/*",
  "video/*",
  "audio/*",
  "text/*",
  ".doc",
  "image/jpeg",
  ".png",
] as const;
// The theme's border-radius / box-shadow presets (client constants/ThemeConstants.tsx). An agent may send the preset
// name or its exact CSS value; names are normalised to the value the property pane stores, so read-back round-trips.
export const BORDER_RADIUS_PRESETS: Readonly<Record<string, string>> = {
  none: "0px",
  M: "0.375rem",
  L: "1.5rem",
};
export const BOX_SHADOW_PRESETS: Readonly<Record<string, string>> = {
  none: "none",
  S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

function presetOrValue(presets: Readonly<Record<string, string>>) {
  const admitted = [...Object.keys(presets), ...Object.values(presets)] as [
    string,
    ...string[],
  ];

  return z.enum(admitted).transform((value) => presets[value] ?? value);
}

const borderRadiusSchema = presetOrValue(BORDER_RADIUS_PRESETS);
const boxShadowSchema = presetOrValue(BOX_SHADOW_PRESETS);
// BUTTON_GROUP controls store a comma-joined subset ("BOLD,ITALIC"); the empty string clears the style.
const labelStyleSchema = z
  .string()
  .max(11)
  .regex(
    /^$|^(BOLD|ITALIC)(,(BOLD|ITALIC))?$/,
    "must be BOLD, ITALIC, 'BOLD,ITALIC' or '' (clear)",
  );
// The widget-level panes of Text and Table offer BOLD | ITALIC (UNDERLINE exists only on table columns).
const fontStyleSchema = labelStyleSchema;
// A tooltip is plain text: the button widget renders `tooltip` through Interweave (an HTML renderer that strips
// scripts but keeps links and images), so markup would become a phishing link or a tracking pixel. Refusing `<`
// keeps every tooltip a string. [Security review, APP-16052 M5]
const plainTooltip = safeText(200).refine(
  (value) => !value.includes("<"),
  "tooltip must be plain text, not markup",
);
// Blueprint icon names are kebab-case identifiers; an unknown name renders no icon (nothing is evaluated).
const iconNameSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be a kebab-case icon name");
const boundedInt = (min: number, max: number) =>
  z.number().int().min(min).max(max);
const leftRightLower = z.enum(["left", "right"]);
const leftRightUpper = z.enum(["LEFT", "RIGHT"]);
// The table's own minimum is -1, its "no default row" sentinel.
const rowIndexSchema = boundedInt(-1, 1_000_000);

// Long-standing common literals that are NOT owner-checked: they pre-date the audit and several are set by the
// build path on widgets outside the 46 buildable types' panes (a modal's title, a container's isVisible). Every other
// literal key in widgetPropsPatchSchema must have a LITERAL_PROP_OWNERS entry; prop-owners-drift.test.ts enforces it.
export const UNGUARDED_LITERALS: ReadonlySet<string> = new Set([
  "text",
  "title",
  "image",
  "options",
  "chartType",
  "chartName",
  "defaultText",
  "dateFormat",
  "isRequired",
  "isDisabled",
  "isVisible",
  "animateLoading",
]);

// Which widget types own each family-specific literal, for every widget type the compiler can build
// (WIDGET_TEMPLATES, 46 types). GENERATED from the widgets' own property-pane sources (`propertyName: "<key>"` in
// widget/index.tsx and propertyConfig files, per-item panelConfig blocks excluded, BaseInputWidget / ContainerWidget
// bases included for their subclasses) and pinned by prop-owners-drift.test.ts, which re-derives the table from the
// client sources and fails on any difference. A key on a widget that does not own it is refused at apply time, so it
// is never written as a silently dead property. One deliberate exclusion: `inputType` stays Input-only because the
// rich text editor's inputType takes a different enum (html | markdown).
export const LITERAL_PROP_OWNERS: Readonly<Record<string, readonly string[]>> =
  {
    labelText: [
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
    ],
    label: [
      "CHECKBOX_WIDGET",
      "CODE_SCANNER_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "FILE_PICKER_WIDGET_V2",
      "INPUT_WIDGET_V2",
      "MENU_BUTTON_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "SWITCH_WIDGET",
    ],
    placeholderText: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
    ],
    defaultCheckedState: ["CHECKBOX_WIDGET"],
    defaultSwitchState: ["SWITCH_WIDGET"],
    defaultOptionValue: [
      "CATEGORY_SLIDER_WIDGET",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "RADIO_GROUP_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
    ],
    inputType: ["INPUT_WIDGET_V2"],
    textColor: ["TABLE_WIDGET_V2", "TEXT_WIDGET"],
    backgroundColor: [
      "CONTAINER_WIDGET",
      "FORM_WIDGET",
      "JSON_FORM_WIDGET",
      "LIST_WIDGET_V2",
      "MODAL_WIDGET",
      "STATBOX_WIDGET",
      "TABS_WIDGET",
      "TEXT_WIDGET",
      "VIDEO_WIDGET",
    ],
    oddRowColor: ["TABLE_WIDGET_V2"],
    evenRowColor: ["TABLE_WIDGET_V2"],
    isVisibleSearch: ["TABLE_WIDGET_V2"],
    enableClientSideSearch: ["TABLE_WIDGET_V2"],
    isVisibleFilters: ["TABLE_WIDGET_V2"],
    isSortable: ["TABLE_WIDGET_V2"],
    isVisibleDownload: ["TABLE_WIDGET_V2"],
    isVisiblePagination: ["TABLE_WIDGET_V2"],
    defaultSelectedRowIndex: ["TABLE_WIDGET_V2"],
    defaultSelectedRowIndices: ["TABLE_WIDGET_V2"],
    multiRowSelection: ["TABLE_WIDGET_V2"],
    primaryColumnId: ["TABLE_WIDGET_V2"],
    serverSidePaginationEnabled: ["TABLE_WIDGET_V2"],
    infiniteScrollEnabled: ["TABLE_WIDGET_V2"],
    enableServerSideFiltering: ["TABLE_WIDGET_V2"],
    defaultSearchText: ["TABLE_WIDGET_V2"],
    allowAddNewRow: ["TABLE_WIDGET_V2"],
    defaultNewRow: ["TABLE_WIDGET_V2"],
    canFreezeColumn: ["TABLE_WIDGET_V2"],
    delimiter: ["TABLE_WIDGET_V2"],
    inlineEditingSaveOption: ["TABLE_WIDGET_V2"],
    compactMode: ["TABLE_WIDGET_V2"],
    textSize: ["TABLE_WIDGET_V2"],
    horizontalAlignment: ["TABLE_WIDGET_V2"],
    verticalAlignment: ["TABLE_WIDGET_V2"],
    cellBackground: ["TABLE_WIDGET_V2"],
    headerRowColor: ["TABLE_WIDGET_V2"],
    headerTextColor: ["TABLE_WIDGET_V2"],
    variant: ["TABLE_WIDGET_V2"],
    overflow: ["TEXT_WIDGET"],
    fontFamily: ["TEXT_WIDGET"],
    fontSize: ["TEXT_WIDGET"],
    textAlign: ["TEXT_WIDGET"],
    fontStyle: ["TABLE_WIDGET_V2", "TEXT_WIDGET"],
    disableLink: ["TEXT_WIDGET"],
    truncateButtonColor: ["TEXT_WIDGET"],
    borderColor: [
      "CONTAINER_WIDGET",
      "FORM_WIDGET",
      "IFRAME_WIDGET",
      "JSON_FORM_WIDGET",
      "STATBOX_WIDGET",
      "TABLE_WIDGET_V2",
      "TABS_WIDGET",
      "TEXT_WIDGET",
    ],
    borderWidth: [
      "CONTAINER_WIDGET",
      "FORM_WIDGET",
      "IFRAME_WIDGET",
      "JSON_FORM_WIDGET",
      "STATBOX_WIDGET",
      "TABLE_WIDGET_V2",
      "TABS_WIDGET",
      "TEXT_WIDGET",
    ],
    borderRadius: [
      "AUDIO_RECORDER_WIDGET",
      "BUTTON_GROUP_WIDGET",
      "BUTTON_WIDGET",
      "CAMERA_WIDGET",
      "CHART_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CODE_SCANNER_WIDGET",
      "CONTAINER_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "FILE_PICKER_WIDGET_V2",
      "FORM_WIDGET",
      "ICON_BUTTON_WIDGET",
      "IFRAME_WIDGET",
      "IMAGE_WIDGET",
      "INPUT_WIDGET_V2",
      "JSON_FORM_WIDGET",
      "LIST_WIDGET_V2",
      "MAP_CHART_WIDGET",
      "MAP_WIDGET",
      "MENU_BUTTON_WIDGET",
      "MODAL_WIDGET",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "STATBOX_WIDGET",
      "TABLE_WIDGET_V2",
      "TABS_WIDGET",
      "VIDEO_WIDGET",
    ],
    boxShadow: [
      "AUDIO_RECORDER_WIDGET",
      "BUTTON_GROUP_WIDGET",
      "BUTTON_WIDGET",
      "CAMERA_WIDGET",
      "CHART_WIDGET",
      "CODE_SCANNER_WIDGET",
      "CONTAINER_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "FILE_PICKER_WIDGET_V2",
      "FORM_WIDGET",
      "ICON_BUTTON_WIDGET",
      "IFRAME_WIDGET",
      "IMAGE_WIDGET",
      "INPUT_WIDGET_V2",
      "JSON_FORM_WIDGET",
      "LIST_WIDGET_V2",
      "MAP_CHART_WIDGET",
      "MAP_WIDGET",
      "MENU_BUTTON_WIDGET",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "STATBOX_WIDGET",
      "TABLE_WIDGET_V2",
      "TABS_WIDGET",
      "VIDEO_WIDGET",
    ],
    accentColor: [
      "AUDIO_RECORDER_WIDGET",
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
      "SWITCH_WIDGET",
      "TABLE_WIDGET_V2",
      "TABS_WIDGET",
    ],
    buttonColor: [
      "BUTTON_WIDGET",
      "CODE_SCANNER_WIDGET",
      "FILE_PICKER_WIDGET_V2",
      "ICON_BUTTON_WIDGET",
    ],
    labelPosition: [
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
      "SWITCH_WIDGET",
    ],
    labelAlignment: [
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
    ],
    alignWidget: ["CHECKBOX_WIDGET", "SWITCH_WIDGET"],
    alignment: ["RADIO_GROUP_WIDGET", "SWITCH_GROUP_WIDGET"],
    labelWidth: [
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
    ],
    labelTooltip: [
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "DATE_PICKER_WIDGET2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
    ],
    tooltip: [
      "BUTTON_WIDGET",
      "CODE_SCANNER_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "ICON_BUTTON_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    labelTextColor: [
      "BUTTON_WIDGET",
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
      "SWITCH_WIDGET",
    ],
    labelTextSize: [
      "BUTTON_WIDGET",
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
      "SWITCH_WIDGET",
    ],
    labelStyle: [
      "BUTTON_WIDGET",
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "INPUT_WIDGET_V2",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
      "SWITCH_WIDGET",
    ],
    maxChars: ["INPUT_WIDGET_V2"],
    minNum: ["INPUT_WIDGET_V2"],
    maxNum: ["INPUT_WIDGET_V2"],
    rtl: ["INPUT_WIDGET_V2", "MULTI_SELECT_WIDGET_V2", "SELECT_WIDGET"],
    iconName: [
      "BUTTON_WIDGET",
      "CODE_SCANNER_WIDGET",
      "ICON_BUTTON_WIDGET",
      "INPUT_WIDGET_V2",
      "MENU_BUTTON_WIDGET",
    ],
    iconAlign: [
      "BUTTON_WIDGET",
      "CODE_SCANNER_WIDGET",
      "INPUT_WIDGET_V2",
      "MENU_BUTTON_WIDGET",
    ],
    isSpellCheck: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    showStepArrows: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    autoFocus: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    shouldAllowAutofill: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    allowFormatting: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    resetOnSubmit: [
      "CURRENCY_INPUT_WIDGET",
      "INPUT_WIDGET_V2",
      "PHONE_INPUT_WIDGET",
    ],
    isFilterable: ["MULTI_SELECT_WIDGET_V2", "SELECT_WIDGET"],
    serverSideFiltering: ["MULTI_SELECT_WIDGET_V2", "SELECT_WIDGET"],
    allowSelectAll: ["MULTI_SELECT_WIDGET_V2"],
    buttonVariant: [
      "BUTTON_GROUP_WIDGET",
      "BUTTON_WIDGET",
      "ICON_BUTTON_WIDGET",
    ],
    placement: ["BUTTON_WIDGET", "CODE_SCANNER_WIDGET", "MENU_BUTTON_WIDGET"],
    disabledWhenInvalid: ["BUTTON_WIDGET", "JSON_FORM_WIDGET"],
    resetFormOnClick: ["BUTTON_WIDGET"],
    defaultImage: ["IMAGE_WIDGET"],
    objectFit: ["IMAGE_WIDGET"],
    maxZoomLevel: ["IMAGE_WIDGET"],
    enableRotation: ["IMAGE_WIDGET"],
    enableDownload: ["IMAGE_WIDGET"],
    shouldScrollContents: [
      "CONTAINER_WIDGET",
      "FORM_WIDGET",
      "MODAL_WIDGET",
      "STATBOX_WIDGET",
      "TABS_WIDGET",
    ],
    canOutsideClickClose: ["MODAL_WIDGET"],
    shouldShowTabs: ["TABS_WIDGET"],
    defaultTab: ["TABS_WIDGET"],
    itemSpacing: ["LIST_WIDGET_V2"],
    serverSidePagination: ["LIST_WIDGET_V2"],
    defaultSelectedItem: ["LIST_WIDGET_V2"],
    defaultDate: ["DATE_PICKER_WIDGET2"],
    minDate: ["DATE_PICKER_WIDGET2"],
    maxDate: ["DATE_PICKER_WIDGET2"],
    firstDayOfWeek: ["DATE_PICKER_WIDGET2"],
    timePrecision: ["DATE_PICKER_WIDGET2"],
    shortcuts: ["DATE_PICKER_WIDGET2"],
    closeOnSelection: ["DATE_PICKER_WIDGET2"],
    seriesName: ["CHART_WIDGET"],
    xAxisName: ["CHART_WIDGET"],
    yAxisName: ["CHART_WIDGET"],
    allowScroll: ["CHART_WIDGET"],
    showDataPointLabel: ["CHART_WIDGET"],
    setAdaptiveYMin: ["CHART_WIDGET"],
    labelOrientation: ["CHART_WIDGET"],
    isInline: [
      "CHECKBOX_GROUP_WIDGET",
      "RADIO_GROUP_WIDGET",
      "SWITCH_GROUP_WIDGET",
    ],
    // Keyboard focus order: the widget factory adds it to every non-Anvil widget that is not display-only
    // (client WidgetProvider/factory/helpers.ts TAB_ORDER_NON_FOCUSABLE_WIDGET_TYPES); the drift test derives this
    // list from that file.
    tabOrder: [
      "AUDIO_RECORDER_WIDGET",
      "AUDIO_WIDGET",
      "BUTTON_GROUP_WIDGET",
      "BUTTON_WIDGET",
      "CAMERA_WIDGET",
      "CATEGORY_SLIDER_WIDGET",
      "CHECKBOX_GROUP_WIDGET",
      "CHECKBOX_WIDGET",
      "CODE_SCANNER_WIDGET",
      "CONTAINER_WIDGET",
      "CURRENCY_INPUT_WIDGET",
      "DATE_PICKER_WIDGET2",
      "FILE_PICKER_WIDGET_V2",
      "FORM_WIDGET",
      "ICON_BUTTON_WIDGET",
      "IFRAME_WIDGET",
      "INPUT_WIDGET_V2",
      "JSON_FORM_WIDGET",
      "LIST_WIDGET_V2",
      "MAP_WIDGET",
      "MENU_BUTTON_WIDGET",
      "MODAL_WIDGET",
      "MULTI_SELECT_TREE_WIDGET",
      "MULTI_SELECT_WIDGET_V2",
      "NUMBER_SLIDER_WIDGET",
      "PHONE_INPUT_WIDGET",
      "RADIO_GROUP_WIDGET",
      "RANGE_SLIDER_WIDGET",
      "RICH_TEXT_EDITOR_WIDGET",
      "SELECT_WIDGET",
      "SINGLE_SELECT_TREE_WIDGET",
      "SWITCH_GROUP_WIDGET",
      "SWITCH_WIDGET",
      "TABLE_WIDGET_V2",
      "TABS_WIDGET",
      "VIDEO_WIDGET",
    ],
    allowedFileTypes: ["FILE_PICKER_WIDGET_V2"],
    fileDataType: ["FILE_PICKER_WIDGET_V2"],
    dynamicTyping: ["FILE_PICKER_WIDGET_V2"],
    maxNumFiles: ["FILE_PICKER_WIDGET_V2"],
    maxFileSize: ["FILE_PICKER_WIDGET_V2"],
  };

// This is deliberately a closed, mostly literal-only property vocabulary. It excludes events, raw bindings,
// dynamic path lists, and arbitrary style/configuration fields that could become executable at render time. The two
// exceptions — `source` (text) and `defaultValue` (input) — are STRUCTURED selected-row references compiled by the
// patch applier into `{{ Table.selectedRow[...] }}` bindings; the agent still never authors expression text.
export const widgetPropsPatchSchema = z
  .object({
    text: safeText(10_000).optional(),
    // Text content: a selected-row ref (detail views) OR a query-field ref (scalar readouts).
    source: z.union([selectedRowRefSchema, queryFieldRefSchema]).optional(),
    // Computed text value (dates, counts, concat) — compiled onto the text prop. Text-only.
    value: computedValueSchema.optional(),
    defaultValue: selectedRowRefSchema.optional(),
    // Dynamic default from ANOTHER widget's property or a query field, compiled onto the widget's own default prop
    // (defaultText / defaultOptionValue / defaultCheckedState / defaultSwitchState / defaultDate by type). The
    // reference is identifier + dotted path; the compiler emits `{{ Widget.path }}` or `{{ Q.data?.field ?? "" }}`.
    defaultFrom: z
      .union([
        z
          .object({ widget: widgetNameSchema, property: entityPropertyPath })
          .strict(),
        queryFieldRefSchema,
      ])
      .optional(),
    // Bind an image's src to a column of a table's selected row (e.g. an employee photo in a detail panel) OR
    // to a field of a query's response.
    imageSource: z
      .union([selectedRowRefSchema, queryFieldRefSchema])
      .optional(),
    // Gate a widget's visibility: on a control's value ({ control, equals } — a view toggle switching panels),
    // on a table having a selected row ({ rowSelected } — detail panels/action buttons), or on an input holding
    // text ({ notEmpty }). Compiled to isVisible.
    visibleWhen: visibleWhenRefSchema.optional(),
    // Re-bind a table's data: a query ref (optionally clear-when-empty) OR (M5) a store key accumulated by
    // wire_event's appendToStore ({ store: '<key>' }). Compiled, never literal-assigned.
    tableData: tableDataBindingSchema.optional(),
    // Add named-format validation to an input (compiled to a vetted regex + error message).
    validation: inputValidationSchema.optional(),
    // Disable this widget while the named input is invalid — compiled to `{{ !<input>.isValid }}`.
    disableWhenInvalid: widgetNameSchema.optional(),
    label: safeText(200).optional(),
    // MULTI_LINE_TEXT is the Input widget's textarea mode (DSL migration 075 renamed it from a separate widget);
    // it is a plain enum literal like the other modes and carries no expression.
    inputType: z
      .enum(["TEXT", "NUMBER", "EMAIL", "PASSWORD", "MULTI_LINE_TEXT"])
      .optional(),
    options: z.array(optionSchema).max(200).optional(),
    // Caption + inert default-state literals. `labelText` is the select/multiselect caption; checkbox, switch,
    // radio, input, date picker and file picker keep theirs in `label`. These are the same keys read_semantic_page
    // reports (SAFE_PROP_KEYS), so an agent can round-trip what it read. Each is a literal (safeText / boolean /
    // scalar; a multiselect default is an array of scalars) — never a binding — and is owner-checked at apply time.
    labelText: safeText(200).optional(),
    defaultCheckedState: z.boolean().optional(),
    defaultSwitchState: z.boolean().optional(),
    defaultOptionValue: z
      .union([literalScalarSchema, z.array(literalScalarSchema).max(200)])
      .optional(),
    title: safeText(200).optional(),
    image: imageUrl.optional(),
    chartType: z
      .enum([
        "LINE_CHART",
        "BAR_CHART",
        "PIE_CHART",
        "COLUMN_CHART",
        "AREA_CHART",
      ])
      .optional(),
    chartName: safeText(200).optional(),
    defaultText: safeText(10_000).optional(),
    placeholderText: safeText(200).optional(),
    dateFormat: safeText(100).optional(),
    isRequired: z.boolean().optional(),
    isDisabled: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    // Table row-striping (TableWidgetV2 style props). Literal colors only — never bindings — so the zebra effect
    // ships as static style, not an evaluated expression.
    oddRowColor: cssColor.optional(),
    evenRowColor: cssColor.optional(),
    // Per-widget badge/pill styling (text widget font + fill; container fill). Literal colors only — never bindings —
    // so they ship as static style, validated by the same grammar as the table row colors above.
    textColor: cssColor.optional(),
    backgroundColor: cssColor.optional(),
    // Table interactivity toggles (TableWidgetV2). Literal booleans — turn on client-side search across all columns,
    // the column filter UI, sorting, download, and pagination for a directory-style browse experience.
    isVisibleSearch: z.boolean().optional(),
    enableClientSideSearch: z.boolean().optional(),
    isVisibleFilters: z.boolean().optional(),
    isSortable: z.boolean().optional(),
    isVisibleDownload: z.boolean().optional(),
    isVisiblePagination: z.boolean().optional(),
    // --- Widget-property audit: the remaining property-pane literals, by family (owners in LITERAL_PROP_OWNERS). ---
    // Table row selection: `defaultSelectedRowIndex` applies while multiRowSelection is off (-1 = no default row,
    // the pane's own minimum), `defaultSelectedRowIndices` while it is on; set multiRowSelection in the same update
    // to switch modes. The other table literals are data modes, adding rows, and header/cell styling.
    defaultSelectedRowIndex: rowIndexSchema.optional(),
    defaultSelectedRowIndices: z
      .array(boundedInt(0, 1_000_000))
      .max(1_000)
      .optional(),
    multiRowSelection: z.boolean().optional(),
    primaryColumnId: tableColumnName.optional(),
    serverSidePaginationEnabled: z.boolean().optional(),
    infiniteScrollEnabled: z.boolean().optional(),
    enableServerSideFiltering: z.boolean().optional(),
    defaultSearchText: safeText(200).optional(),
    allowAddNewRow: z.boolean().optional(),
    defaultNewRow: z
      .record(tableColumnName, literalScalarSchema)
      .refine((row) => Object.keys(row).length <= 100, "at most 100 columns")
      .optional(),
    canFreezeColumn: z.boolean().optional(),
    delimiter: z.enum([",", ";", "|", "\t"]).optional(),
    inlineEditingSaveOption: z.enum(["ROW_LEVEL", "CUSTOM"]).optional(),
    compactMode: z.enum(["SHORT", "DEFAULT", "TALL"]).optional(),
    textSize: z.enum(TABLE_TEXT_SIZES).optional(),
    horizontalAlignment: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
    verticalAlignment: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
    cellBackground: cssColor.optional(),
    headerRowColor: cssColor.optional(),
    headerTextColor: cssColor.optional(),
    variant: z.enum(["DEFAULT", "VARIANT2", "VARIANT3"]).optional(),
    // Text widget typography and overflow.
    overflow: z.enum(["NONE", "SCROLL", "TRUNCATE"]).optional(),
    fontFamily: z.enum(FONT_FAMILIES).optional(),
    fontSize: z.enum(FONT_SIZES).optional(),
    textAlign: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
    fontStyle: fontStyleSchema.optional(),
    disableLink: z.boolean().optional(),
    truncateButtonColor: cssColor.optional(),
    // Shared style: border, radius, shadow, accent, button fill, loading skeleton.
    borderColor: cssColor.optional(),
    borderWidth: boundedInt(0, 50).optional(),
    borderRadius: borderRadiusSchema.optional(),
    boxShadow: boxShadowSchema.optional(),
    accentColor: cssColor.optional(),
    buttonColor: cssColor.optional(),
    animateLoading: z.boolean().optional(),
    // Form-control labels: placement, width, tooltip and typography.
    labelPosition: z.enum(LABEL_POSITIONS).optional(),
    labelAlignment: leftRightLower.optional(),
    alignWidget: leftRightUpper.optional(),
    alignment: leftRightLower.optional(),
    labelWidth: boundedInt(0, 64).optional(),
    labelTooltip: plainTooltip.optional(),
    tooltip: plainTooltip.optional(),
    labelTextColor: cssColor.optional(),
    labelTextSize: z.enum(FONT_SIZES).optional(),
    labelStyle: labelStyleSchema.optional(),
    // Input: length/number bounds, direction, icon, behaviour toggles.
    maxChars: boundedInt(1, 1_000_000).optional(),
    minNum: z.number().finite().optional(),
    maxNum: z.number().finite().optional(),
    rtl: z.boolean().optional(),
    iconName: iconNameSchema.optional(),
    iconAlign: leftRightLower.optional(),
    isSpellCheck: z.boolean().optional(),
    showStepArrows: z.boolean().optional(),
    autoFocus: z.boolean().optional(),
    shouldAllowAutofill: z.boolean().optional(),
    allowFormatting: z.boolean().optional(),
    resetOnSubmit: z.boolean().optional(),
    // Select / multiselect.
    isFilterable: z.boolean().optional(),
    serverSideFiltering: z.boolean().optional(),
    allowSelectAll: z.boolean().optional(),
    // Button.
    buttonVariant: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]).optional(),
    placement: z.enum(["START", "BETWEEN", "CENTER"]).optional(),
    disabledWhenInvalid: z.boolean().optional(),
    resetFormOnClick: z.boolean().optional(),
    // Image.
    defaultImage: imageUrl.optional(),
    objectFit: z.enum(["contain", "cover", "auto"]).optional(),
    maxZoomLevel: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(4),
        z.literal(8),
        z.literal(16),
      ])
      .optional(),
    enableRotation: z.boolean().optional(),
    enableDownload: z.boolean().optional(),
    // Container / form / modal / tabs / list.
    shouldScrollContents: z.boolean().optional(),
    canOutsideClickClose: z.boolean().optional(),
    shouldShowTabs: z.boolean().optional(),
    defaultTab: safeText(200).optional(),
    // Tab order on a Tabs widget: the widget's existing tab labels in the wanted order (a permutation; every tab
    // named exactly once). The compiler rewrites each tab's `index` in `tabsObj`; the structure itself is never
    // agent-authored. A label the widget does not have, a missing tab, or a duplicate is refused.
    reorderTabs: z
      .array(safeText(200).pipe(z.string().min(1)))
      .min(1)
      .max(20)
      .optional(),
    // Keyboard focus order (the platform-level Accessibility > Tab order property the widget factory adds to every
    // focusable widget): a positive integer; numbered widgets are focused first (lowest first), the rest follow in
    // the automatic top-to-bottom, left-to-right order. null clears it back to Auto.
    tabOrder: z.union([boundedInt(1, 1_000), z.null()]).optional(),
    itemSpacing: boundedInt(0, 16).optional(),
    serverSidePagination: z.boolean().optional(),
    defaultSelectedItem: literalScalarSchema.optional(),
    // Date picker.
    defaultDate: isoDateLiteral.optional(),
    minDate: isoDateLiteral.optional(),
    maxDate: isoDateLiteral.optional(),
    firstDayOfWeek: boundedInt(0, 6).optional(),
    timePrecision: z.enum(["None", "minute", "second"]).optional(),
    shortcuts: z.boolean().optional(),
    closeOnSelection: z.boolean().optional(),
    // Chart.
    seriesName: safeText(200).optional(),
    xAxisName: safeText(200).optional(),
    yAxisName: safeText(200).optional(),
    allowScroll: z.boolean().optional(),
    showDataPointLabel: z.boolean().optional(),
    setAdaptiveYMin: z.boolean().optional(),
    labelOrientation: z.enum(["auto", "slant", "rotate", "stagger"]).optional(),
    // Radio.
    isInline: z.boolean().optional(),
    // File picker.
    allowedFileTypes: z
      .array(z.enum(FILE_TYPES))
      .max(FILE_TYPES.length)
      .optional(),
    fileDataType: z.enum(["Base64", "Text", "Binary", "Array"]).optional(),
    dynamicTyping: z.boolean().optional(),
    maxNumFiles: boundedInt(1, 1_000).optional(),
    maxFileSize: boundedInt(1, 200).optional(),
  })
  .strict()
  .refine((props) => Object.keys(props).length > 0, "must update a property");

const positionSchema = z
  .object({
    topRow: z.number().int().min(0),
    leftColumn: z.number().int().min(0),
  })
  .strict();

// One update's props are bounded as a whole: the per-field caps (a 200-option list, a 100-column defaultNewRow of
// 10 KB strings) still multiply to megabytes, and every byte lands in the page DSL.
export const UPDATE_PROPS_MAX_BYTES = 64 * 1024;

const updateOperationSchema = z
  .object({
    kind: z.literal("update"),
    name: widgetNameSchema,
    props: widgetPropsPatchSchema,
  })
  .strict()
  .refine(
    (operation) =>
      Buffer.byteLength(JSON.stringify(operation.props), "utf8") <=
      UPDATE_PROPS_MAX_BYTES,
    `an update's props must serialise to at most ${UPDATE_PROPS_MAX_BYTES} bytes`,
  );

const moveOperationSchema = z
  .object({
    kind: z.literal("move"),
    name: widgetNameSchema,
    parent: widgetNameSchema.optional(),
    position: positionSchema.optional(),
    // Default (false): a position that lands on another widget is REPAIRED to the nearest free spot below, and the
    // adjustment is reported. strict: true rejects the collision instead, naming the colliders and the nearest
    // free position so one retry can succeed.
    strict: z.boolean().optional(),
  })
  .strict()
  .refine(
    (operation) =>
      operation.parent !== undefined || operation.position !== undefined,
    "must set parent or position",
  );

// M6 (B2): resize a widget in grid units. rows/columns are the widget's SPAN (bottomRow - topRow /
// rightColumn - leftColumn); at least one is required. Modals translate rows into their pixel height prop.
const resizeOperationSchema = z
  .object({
    kind: z.literal("resize"),
    name: widgetNameSchema,
    rows: z.number().int().min(1).max(MAX_ROW).optional(),
    columns: z.number().int().min(1).max(MAX_ROW).optional(),
    // Default (false): growth that collides pushes the overlapping siblings down (cascade). strict: true rejects
    // the collision instead, naming the colliders.
    strict: z.boolean().optional(),
  })
  .strict()
  .refine(
    (operation) =>
      operation.rows !== undefined || operation.columns !== undefined,
    "must set rows or columns",
  );

const removeOperationSchema = z
  .object({
    kind: z.literal("remove"),
    name: widgetNameSchema,
  })
  .strict();

export const widgetPatchSchema = z
  .object({
    operations: z
      .array(
        z.union([
          updateOperationSchema,
          moveOperationSchema,
          resizeOperationSchema,
          removeOperationSchema,
        ]),
      )
      .min(1)
      .max(50),
  })
  .strict();

export type WidgetPatch = z.infer<typeof widgetPatchSchema>;
export type WidgetPatchOperation = WidgetPatch["operations"][number];
export type WidgetPropsPatch = z.infer<typeof widgetPropsPatchSchema>;

export interface WidgetPatchChange {
  kind: WidgetPatchOperation["kind"];
  widgetName: string;
  changedProps?: (keyof WidgetPropsPatch)[];
  previousParentWidgetName?: string;
  parentWidgetName?: string;
  previousPosition?: { topRow: number; leftColumn: number };
  position?: { topRow: number; leftColumn: number };
  // Present when a colliding move was repaired: what the caller asked for vs the `position` actually applied.
  requestedPosition?: { topRow: number; leftColumn: number };
  // resize semantics: the widget's span in grid units before/after (modals report rows derived from their px height).
  previousSize?: { rows?: number; columns?: number };
  size?: { rows?: number; columns?: number };
}

export interface WidgetPatchResult {
  dsl: WidgetNode;
  changes: WidgetPatchChange[];
  // Human-readable adjustment reports (collision repairs, cascade pushes, modal-scroll warnings). Agents skim
  // `changes`; they read notes — every automatic adjustment is surfaced here too.
  notes: string[];
}

interface LocatedWidget {
  node: WidgetNode;
  parent?: WidgetNode;
}

function cloneDsl(dsl: WidgetNode): WidgetNode {
  return JSON.parse(JSON.stringify(dsl)) as WidgetNode;
}

function indexWidgets(root: WidgetNode): Map<string, LocatedWidget> {
  const widgets = new Map<string, LocatedWidget>();

  function visit(node: WidgetNode, parent?: WidgetNode): void {
    if (widgets.has(node.widgetName)) {
      throw new Error(`widget names must be unique: "${node.widgetName}"`);
    }

    widgets.set(node.widgetName, { node, parent });

    for (const child of node.children ?? []) visit(child, node);
  }

  visit(root);

  return widgets;
}

function requireWidget(
  widgets: Map<string, LocatedWidget>,
  name: string,
): LocatedWidget {
  const widget = widgets.get(name);

  if (!widget) throw new Error(`widget "${name}" was not found`);

  if (widget.node.widgetId === ROOT_WIDGET_ID) {
    throw new Error("the root canvas cannot be modified");
  }

  return widget;
}

function directCanvas(node: WidgetNode): WidgetNode | undefined {
  if (node.type === "CANVAS_WIDGET") return node;

  return node.children?.find((child) => child.type === "CANVAS_WIDGET");
}

function isDescendant(ancestor: WidgetNode, candidate: WidgetNode): boolean {
  for (const child of ancestor.children ?? []) {
    if (
      child.widgetId === candidate.widgetId ||
      isDescendant(child, candidate)
    ) {
      return true;
    }
  }

  return false;
}

function removeFromParent(widget: LocatedWidget): void {
  if (!widget.parent?.children) {
    throw new Error(
      `widget "${widget.node.widgetName}" has no removable parent`,
    );
  }

  const index = widget.parent.children.findIndex(
    (child) => child.widgetId === widget.node.widgetId,
  );

  if (index === -1) {
    throw new Error(`widget "${widget.node.widgetName}" is not in its parent`);
  }

  widget.parent.children.splice(index, 1);
}

function positionOf(node: WidgetNode): { topRow: number; leftColumn: number } {
  return { topRow: node.topRow, leftColumn: node.leftColumn };
}

function registerDynamicBinding(node: WidgetNode, key: string): void {
  const paths = Array.isArray(node.dynamicBindingPathList)
    ? (node.dynamicBindingPathList as { key: string }[])
    : [];

  if (!paths.some((entry) => entry.key === key)) paths.push({ key });

  node.dynamicBindingPathList = paths;
}

// When a literal replaces a previously bound property, the stale dynamic-path entry must go too — otherwise the
// widget keeps advertising a binding it no longer has.
// A literal replaces whatever binding the property carried: drop it from the evaluator's binding list and from the
// property pane's JS-mode list, so the pane shows the literal as a plain value rather than "JS mode" text.
function unregisterDynamicBinding(node: WidgetNode, key: string): void {
  for (const list of ["dynamicBindingPathList", "dynamicPropertyPathList"]) {
    if (!Array.isArray(node[list])) continue;

    node[list] = (node[list] as { key: string }[]).filter(
      (entry) => entry.key !== key,
    );
  }
}

// Compile a structured selected-row reference onto a widget: type-checked target property, dangling-table guard,
// compiler-emitted binding, and dynamic-path registration. The agent never supplies the expression.
function applySelectedRowBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: SelectedRowRef,
  expected: { widgetType: string; property: string; field: string },
): void {
  if (node.type !== expected.widgetType) {
    throw new Error(
      `'${expected.field}' can only be set on a ${expected.widgetType} ("${node.widgetName}" is ${node.type})`,
    );
  }

  const table = widgets.get(ref.table);

  if (!table) throw new Error(`table "${ref.table}" was not found`);

  if (table.node.type !== "TABLE_WIDGET_V2") {
    throw new Error(`"${ref.table}" is not a table widget`);
  }

  node[expected.property] = compileSelectedRowBinding(ref);
  registerDynamicBinding(node, expected.property);
}

// The default prop each widget family reads on load. A `defaultFrom` binding lands on exactly this prop, so the
// vocabulary stays "one structured ref per widget type" and never a free property name. A table's default prop
// depends on its selection mode (see defaultPropOf).
const DEFAULT_PROP_BY_TYPE: Record<string, string> = {
  INPUT_WIDGET_V2: "defaultText",
  SELECT_WIDGET: "defaultOptionValue",
  MULTI_SELECT_WIDGET_V2: "defaultOptionValue",
  RADIO_GROUP_WIDGET: "defaultOptionValue",
  CHECKBOX_WIDGET: "defaultCheckedState",
  SWITCH_WIDGET: "defaultSwitchState",
  DATE_PICKER_WIDGET2: "defaultDate",
};

// A table's effective selection mode after this update: a multiRowSelection literal in the same patch wins over
// the stored value, so an agent can switch modes and set the matching default in one operation.
function tableMultiRowSelection(
  node: WidgetNode,
  literals: Record<string, unknown>,
): boolean {
  return literals.multiRowSelection !== undefined
    ? literals.multiRowSelection === true
    : node.multiRowSelection === true;
}

const DEFAULT_FROM_TYPES: readonly string[] = [
  ...Object.keys(DEFAULT_PROP_BY_TYPE),
  "TABLE_WIDGET_V2",
];

function defaultPropOf(
  node: WidgetNode,
  literals: Record<string, unknown>,
): string | undefined {
  if (node.type === "TABLE_WIDGET_V2") {
    return tableMultiRowSelection(node, literals)
      ? "defaultSelectedRowIndices"
      : "defaultSelectedRowIndex";
  }

  return DEFAULT_PROP_BY_TYPE[node.type];
}

// Widget types whose default is a list of option values, so `defaultOptionValue` must be an array there and a
// scalar everywhere else.
const MULTI_VALUE_DEFAULT_TYPES: ReadonlySet<string> = new Set([
  "MULTI_SELECT_WIDGET_V2",
  "MULTI_SELECT_TREE_WIDGET",
]);

// Label position by family: the labelled controls (input, select, date picker, radio, sliders, …) offer
// Auto | Top | Left; checkbox and switch offer Left | Right. Their validation is plain TEXT, so an off-pane value
// would be stored silently and render an undefined layout.
const SIDE_ONLY_LABEL_POSITION_TYPES: ReadonlySet<string> = new Set([
  "CHECKBOX_WIDGET",
  "SWITCH_WIDGET",
]);
// The three sliders offer Left | Top (no Auto).
const NO_AUTO_LABEL_POSITION_TYPES: ReadonlySet<string> = new Set([
  "NUMBER_SLIDER_WIDGET",
  "CATEGORY_SLIDER_WIDGET",
  "RANGE_SLIDER_WIDGET",
]);

// Literal shape rules that depend on the widget's state, not just its type: the table's default-row prop must match
// its selection mode (the pane hides the other one, so writing it would be a dead property), and a multiselect
// default is an array while select/radio defaults are scalars.
function checkLiteralShapes(
  node: WidgetNode,
  literals: Record<string, unknown>,
): void {
  if (node.type === "TABLE_WIDGET_V2") {
    const multi = tableMultiRowSelection(node, literals);

    if (literals.defaultSelectedRowIndex !== undefined && multi) {
      throw new Error(
        `'defaultSelectedRowIndex' applies while multi-row selection is off ("${node.widgetName}" has multiRowSelection on): set 'defaultSelectedRowIndices', or set multiRowSelection: false in the same update`,
      );
    }

    if (literals.defaultSelectedRowIndices !== undefined && !multi) {
      throw new Error(
        `'defaultSelectedRowIndices' applies while multi-row selection is on ("${node.widgetName}" has multiRowSelection off): set 'defaultSelectedRowIndex', or set multiRowSelection: true in the same update`,
      );
    }
  }

  if (literals.defaultOptionValue !== undefined) {
    const isArray = Array.isArray(literals.defaultOptionValue);
    const multi = MULTI_VALUE_DEFAULT_TYPES.has(node.type);

    if (multi && !isArray) {
      throw new Error(
        `'defaultOptionValue' on a ${node.type} must be an array of option values ("${node.widgetName}")`,
      );
    }

    if (!multi && isArray) {
      throw new Error(
        `'defaultOptionValue' on ${node.type} must be a single option value ("${node.widgetName}")`,
      );
    }
  }

  if (literals.labelPosition !== undefined) {
    const admitted = SIDE_ONLY_LABEL_POSITION_TYPES.has(node.type)
      ? ["Left", "Right"]
      : NO_AUTO_LABEL_POSITION_TYPES.has(node.type)
        ? ["Left", "Top"]
        : ["Auto", "Top", "Left"];

    if (!admitted.includes(String(literals.labelPosition))) {
      throw new Error(
        `'labelPosition' on a ${node.type} must be ${admitted.join(" | ")} ("${node.widgetName}")`,
      );
    }
  }
}

// Labels echoed in an error message: a label that carries binding syntax (editor-authored) is shown as a
// placeholder, matching read_semantic_page, which hides such labels instead of exposing binding source.
function quoteLabel(label: string): string {
  return RAW_EXPRESSION.test(label) ? "<bound label>" : `"${label}"`;
}

// Reorder a Tabs widget's tabs: `order` must name every existing tab exactly once. Only each tab's `index` is
// rewritten; ids, canvases and labels are untouched, so the operation cannot create, drop or rename a tab.
function applyReorderTabs(node: WidgetNode, order: string[]): void {
  if (node.type !== "TABS_WIDGET") {
    throw new Error(
      `'reorderTabs' can only be set on TABS_WIDGET ("${node.widgetName}" is ${node.type})`,
    );
  }

  const entries = tabEntriesOf(node);
  const labels = entries.map((tab) => tab.label);

  if (new Set(labels).size !== labels.length) {
    throw new Error(
      `"${node.widgetName}" has two tabs with the same label; rename one in the editor before reordering`,
    );
  }

  const quote = (names: string[]) => names.map(quoteLabel).join(", ");
  const unknown = order.filter((label) => !labels.includes(label));
  const duplicated = order.filter((label, i) => order.indexOf(label) !== i);
  const missing = labels.filter((label) => !order.includes(label));

  if (unknown.length > 0 || duplicated.length > 0 || missing.length > 0) {
    throw new Error(
      `'reorderTabs' must list every tab of "${node.widgetName}" exactly once (tabs: ${quote(labels)})` +
        (unknown.length > 0 ? `; not a tab: ${quote(unknown)}` : "") +
        (duplicated.length > 0 ? `; repeated: ${quote(duplicated)}` : "") +
        (missing.length > 0 ? `; missing: ${quote(missing)}` : ""),
    );
  }

  const tabsObj = node.tabsObj as Record<string, { index?: number }>;

  for (const tab of entries) {
    tabsObj[tab.id].index = order.indexOf(tab.label);
  }
}

// Compile a `defaultFrom` reference onto the widget's default prop: a widget-property ref emits `{{ W.path }}`
// (identifier + dotted path, nothing else), a query-field ref the shared query binding. The source widget must
// exist on the page (dangling guard). A literal for the same default prop, or a selected-row `defaultValue`, in the
// same update would race the binding, so the ambiguity is rejected.
function applyDefaultFromBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: { widget: string; property: string } | QueryFieldRef,
  conflicts: {
    defaultValue: SelectedRowRef | undefined;
    literals: Record<string, unknown>;
  },
): void {
  const property = defaultPropOf(node, conflicts.literals);

  if (property === undefined) {
    throw new Error(
      `'defaultFrom' can only be set on ${DEFAULT_FROM_TYPES.join(" / ")} ("${node.widgetName}" is ${node.type})`,
    );
  }

  if (conflicts.defaultValue !== undefined) {
    throw new Error(
      "cannot set both 'defaultValue' and 'defaultFrom' in one update",
    );
  }

  if (conflicts.literals[property] !== undefined) {
    throw new Error(
      `cannot set both '${property}' and 'defaultFrom' in one update`,
    );
  }

  if ("widget" in ref) {
    const sourceWidget = widgets.get(ref.widget);

    if (!sourceWidget) throw new Error(`widget "${ref.widget}" was not found`);

    if (sourceWidget.node === node) {
      throw new Error("'defaultFrom' cannot reference the widget itself");
    }

    node[property] = `{{ ${ref.widget}.${ref.property} }}`;
  } else {
    node[property] = compileQueryFieldBinding(ref);
  }

  registerDynamicBinding(node, property);
}

// A scalar display slot (text's content, image's src) accepts EITHER a selected-row ref or a query-field ref;
// the strict object shapes discriminate by key. Selected-row refs get the dangling-table guard; query refs
// compile directly (queries live outside the widget map, matching applyTableDataBinding's posture).
function applyScalarDisplayBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: SelectedRowRef | QueryFieldRef,
  expected: { widgetType: string; property: string; field: string },
): void {
  if ("table" in ref) {
    applySelectedRowBinding(widgets, node, ref, expected);

    return;
  }

  if (node.type !== expected.widgetType) {
    throw new Error(
      `'${expected.field}' can only be set on a ${expected.widgetType} ("${node.widgetName}" is ${node.type})`,
    );
  }

  node[expected.property] = compileQueryFieldBinding(ref);
  registerDynamicBinding(node, expected.property);
}

// Re-bind a table's data to a query (optionally clear-when-empty) or to a store key (M5). Type-checks the target,
// verifies the guard input exists, emits the binding from the closed vocabulary, and registers the dynamic path.
// The agent never supplies expression text.
function applyTableDataBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: TableDataBinding,
): void {
  if (node.type !== "TABLE_WIDGET_V2") {
    throw new Error(
      `'tableData' can only be set on a TABLE_WIDGET_V2 ("${node.widgetName}" is ${node.type})`,
    );
  }

  // The store form has no guard/field to verify — its key is schema-validated and the binding head (appsmith) is
  // always valid, so it compiles directly.
  if ("store" in ref) {
    node.tableData = compileTableDataBinding(ref);
    registerDynamicBinding(node, "tableData");

    return;
  }

  // The guard is emitted as `${guard}.text` — so it must be an input widget. A non-input has no `.text` (undefined
  // is falsy), which would silently keep the table permanently empty; reject that up front instead.
  if (ref.clearWhenEmpty !== undefined) {
    const guard = widgets.get(ref.clearWhenEmpty);

    if (!guard) {
      throw new Error(
        `clearWhenEmpty input "${ref.clearWhenEmpty}" was not found`,
      );
    }

    if (guard.node.type !== "INPUT_WIDGET_V2") {
      throw new Error(
        `clearWhenEmpty "${ref.clearWhenEmpty}" must be an input widget (it is ${guard.node.type})`,
      );
    }
  }

  node.tableData = compileTableDataBinding(ref);
  registerDynamicBinding(node, "tableData");
}

// Add named-format validation to an input: emits a vetted literal regex + error message and marks the input
// required (so an empty value is invalid too). Input-only; the agent never supplies a regex.
function applyInputValidation(node: WidgetNode, ref: InputValidationRef): void {
  if (node.type !== "INPUT_WIDGET_V2") {
    throw new Error(
      `'validation' can only be set on an INPUT_WIDGET_V2 ("${node.widgetName}" is ${node.type})`,
    );
  }

  const { errorMessage, regex } = compileInputValidation(ref);

  node.regex = regex;
  node.errorMessage = errorMessage;
  node.isRequired = true;
}

// Disable a widget while the named input is invalid — emits `{{ !<input>.isValid }}` onto isDisabled and registers
// the dynamic path. The referenced widget must be an input (only inputs expose `.isValid`).
function applyDisableWhenInvalid(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  inputName: string,
): void {
  const input = widgets.get(inputName);

  if (!input) {
    throw new Error(`disableWhenInvalid input "${inputName}" was not found`);
  }

  if (input.node.type !== "INPUT_WIDGET_V2") {
    throw new Error(
      `disableWhenInvalid "${inputName}" must be an input widget (it is ${input.node.type})`,
    );
  }

  node.isDisabled = compileDisableWhenInvalid(inputName);
  registerDynamicBinding(node, "isDisabled");
}

// The meta value property a control widget exposes, used by visibleWhen. Only controls that hold a single selectable
// value are supported; the agent never supplies the property name.
const CONTROL_VALUE_PROPS: Record<string, string> = {
  SELECT_WIDGET: "selectedOptionValue",
  TABS_WIDGET: "selectedTab",
};

// Gate a widget's visibility on a control's value — emits `{{ Control.<valueProp> === '<equals>' }}` onto isVisible.
// The control must exist and be a supported single-value control.
function applyVisibleWhenBinding(
  widgets: Map<string, LocatedWidget>,
  node: WidgetNode,
  ref: VisibleWhenRef,
): void {
  // Row-selection predicate: visible only while the referenced table has a selected row.
  if ("rowSelected" in ref) {
    const table = widgets.get(ref.rowSelected);

    if (!table) {
      throw new Error(`visibleWhen table "${ref.rowSelected}" was not found`);
    }

    if (table.node.type !== "TABLE_WIDGET_V2") {
      throw new Error(`"${ref.rowSelected}" is not a table widget`);
    }

    node.isVisible = compileRowSelectedBinding(ref.rowSelected);
    registerDynamicBinding(node, "isVisible");

    return;
  }

  // Non-empty-input predicate: visible only while the referenced input holds text.
  if ("notEmpty" in ref) {
    const input = widgets.get(ref.notEmpty);

    if (!input) {
      throw new Error(`visibleWhen input "${ref.notEmpty}" was not found`);
    }

    if (input.node.type !== "INPUT_WIDGET_V2") {
      throw new Error(
        `visibleWhen "${ref.notEmpty}" must be an input widget (it is ${input.node.type})`,
      );
    }

    node.isVisible = compileNotEmptyBinding(ref.notEmpty);
    registerDynamicBinding(node, "isVisible");

    return;
  }

  const control = widgets.get(ref.control);

  if (!control) {
    throw new Error(`visibleWhen control "${ref.control}" was not found`);
  }

  const valueProp = CONTROL_VALUE_PROPS[control.node.type];

  if (!valueProp) {
    throw new Error(
      `visibleWhen "${ref.control}" must be a select or tabs control (it is ${control.node.type})`,
    );
  }

  node.isVisible = compileVisibleWhenBinding(
    ref.control,
    valueProp,
    ref.equals,
  );
  registerDynamicBinding(node, "isVisible");
}

function formatPosition(position: Position): string {
  return `{ topRow: ${position.topRow}, leftColumn: ${position.leftColumn} }`;
}

function formatNames(names: string[]): string {
  return names.map((name) => `"${name}"`).join(", ");
}

// Fold the container-fit cascade's adjustments into the patch result so every server-initiated push/growth is
// visible in `changes` alongside the operation that caused it.
function mergeCascade(
  changes: WidgetPatchChange[],
  notes: string[],
  cascade: { adjustments: CascadeAdjustment[]; notes: string[] },
): void {
  for (const adjustment of cascade.adjustments) {
    changes.push({ ...adjustment });
  }

  notes.push(...cascade.notes);
}

// The inner CANVAS_WIDGET children of a container-like widget (one for containers/forms/modals, one per tab for
// tabs). Empty for plain widgets.
function innerCanvasesOf(node: WidgetNode): WidgetNode[] {
  return (node.children ?? []).filter(
    (child) => child.type === "CANVAS_WIDGET",
  );
}

// Applies local, typed widget mutations without interpreting templates or bindings. The input DSL is never mutated.
export function applyWidgetPatch(
  currentDsl: WidgetNode,
  patchInput: unknown,
): WidgetPatchResult {
  const patch = widgetPatchSchema.parse(patchInput);
  const dsl = cloneDsl(currentDsl);
  const changes: WidgetPatchChange[] = [];
  const notes: string[] = [];

  for (const operation of patch.operations) {
    const widgets = indexWidgets(dsl);
    const located = requireWidget(widgets, operation.name);

    if (operation.kind === "update") {
      // Structured binding refs are compiled (never literal-assigned); everything else is a plain literal.
      const {
        defaultFrom,
        defaultValue,
        disableWhenInvalid,
        imageSource,
        reorderTabs,
        source,
        tableData,
        validation,
        value,
        visibleWhen,
        ...literals
      } = operation.props;

      // A binding and a literal for the same property in one patch would silently race; reject the ambiguity.
      if (source !== undefined && literals.text !== undefined) {
        throw new Error("cannot set both 'text' and 'source' in one update");
      }

      // `value` (computed) also compiles onto the text prop — any combination with text/source is ambiguous.
      if (
        value !== undefined &&
        (literals.text !== undefined || source !== undefined)
      ) {
        throw new Error(
          "cannot set both 'value' and 'text'/'source' in one update",
        );
      }

      if (defaultValue !== undefined && literals.defaultText !== undefined) {
        throw new Error(
          "cannot set both 'defaultText' and 'defaultValue' in one update",
        );
      }

      if (imageSource !== undefined && literals.image !== undefined) {
        throw new Error(
          "cannot set both 'image' and 'imageSource' in one update",
        );
      }

      if (visibleWhen !== undefined && literals.isVisible !== undefined) {
        throw new Error(
          "cannot set both 'isVisible' and 'visibleWhen' in one update",
        );
      }

      // disableWhenInvalid emits an isDisabled binding; a literal isDisabled in the same update would race it.
      if (
        disableWhenInvalid !== undefined &&
        literals.isDisabled !== undefined
      ) {
        throw new Error(
          "cannot set both 'isDisabled' and 'disableWhenInvalid' in one update",
        );
      }

      // validation marks the input required (so empty is invalid too); a literal isRequired in the same update runs
      // last via Object.assign and would silently clobber it — reject the ambiguity rather than defeat the guard.
      if (validation !== undefined && literals.isRequired !== undefined) {
        throw new Error(
          "cannot set both 'isRequired' and 'validation' in one update",
        );
      }

      // Family-specific literals are checked against the widget's real type: writing one onto another widget type
      // would be a silently dead property (Object.assign is unchecked), so the mismatch is rejected instead.
      for (const [key, value] of Object.entries(literals)) {
        const owners = LITERAL_PROP_OWNERS[key];

        if (
          value !== undefined &&
          owners !== undefined &&
          !owners.includes(located.node.type)
        ) {
          throw new Error(
            `'${key}' can only be set on ${owners.join(" / ")} ("${located.node.widgetName}" is ${located.node.type})`,
          );
        }
      }

      checkLiteralShapes(located.node, literals);

      if (source !== undefined) {
        applyScalarDisplayBinding(widgets, located.node, source, {
          widgetType: "TEXT_WIDGET",
          property: "text",
          field: "source",
        });
      }

      if (value !== undefined) {
        if (located.node.type !== "TEXT_WIDGET") {
          throw new Error(
            `'value' can only be set on a TEXT_WIDGET ("${located.node.widgetName}" is ${located.node.type})`,
          );
        }

        // Guard parity with `source` [COUNCIL: B2 architect]: every { table, column } ref inside the
        // computed value (concat parts, formula leaves) gets the same dangling-table checks; query refs
        // stay unguarded per the documented posture (queries live outside the widget map, and a missing
        // query degrades to a blank part, a safe fail).
        for (const tableName of computedValueTableRefs(value)) {
          const table = widgets.get(tableName);

          if (!table) throw new Error(`table "${tableName}" was not found`);

          if (table.node.type !== "TABLE_WIDGET_V2") {
            throw new Error(`"${tableName}" is not a table widget`);
          }
        }

        located.node.text = compileComputedValue(value);
        registerDynamicBinding(located.node, "text");
      }

      if (defaultValue !== undefined) {
        applySelectedRowBinding(widgets, located.node, defaultValue, {
          widgetType: "INPUT_WIDGET_V2",
          property: "defaultText",
          field: "defaultValue",
        });
      }

      if (defaultFrom !== undefined) {
        applyDefaultFromBinding(widgets, located.node, defaultFrom, {
          defaultValue,
          literals,
        });
      }

      if (imageSource !== undefined) {
        applyScalarDisplayBinding(widgets, located.node, imageSource, {
          widgetType: "IMAGE_WIDGET",
          property: "image",
          field: "imageSource",
        });
      }

      if (tableData !== undefined) {
        applyTableDataBinding(widgets, located.node, tableData);
      }

      if (validation !== undefined) {
        applyInputValidation(located.node, validation);
      }

      if (disableWhenInvalid !== undefined) {
        applyDisableWhenInvalid(widgets, located.node, disableWhenInvalid);
      }

      if (visibleWhen !== undefined) {
        applyVisibleWhenBinding(widgets, located.node, visibleWhen);
      }

      if (reorderTabs !== undefined)
        applyReorderTabs(located.node, reorderTabs);

      // `defaultTab` names one of the widget's tabs (by label); the client shows the first tab for an unknown name.
      // An empty string is the editor's own "no default → first tab" and is allowed through.
      if (literals.defaultTab !== undefined && literals.defaultTab !== "") {
        const labels = tabLabelsOf(located.node);

        if (!labels.includes(literals.defaultTab)) {
          throw new Error(
            `'defaultTab' "${literals.defaultTab}" is not a tab of "${located.node.widgetName}" (tabs: ${labels.map(quoteLabel).join(", ")})`,
          );
        }
      }

      // The editor clears Tab order by deleting the key (ClearableNumericInputControl); persist the same shape so
      // read_semantic_page shows "absent = automatic" after an MCP clear too.
      if (literals.tabOrder === null) {
        delete located.node.tabOrder;
        delete literals.tabOrder;
      }

      Object.assign(located.node, literals);

      // A literal overwriting a previously bound property clears its dynamic-path registration: a compiler binding
      // (source / defaultValue / imageSource / disableWhenInvalid / visibleWhen), or the theme binding that style
      // props such as borderRadius, boxShadow, accentColor and fontFamily carry by default.
      for (const [key, value] of Object.entries(literals)) {
        if (value !== undefined) unregisterDynamicBinding(located.node, key);
      }

      changes.push({
        kind: "update",
        widgetName: operation.name,
        changedProps: Object.keys(
          operation.props,
        ) as (keyof WidgetPropsPatch)[],
      });
      continue;
    }

    if (operation.kind === "remove") {
      if ((located.node.children?.length ?? 0) > 0) {
        throw new Error(
          `widget "${operation.name}" has children; remove them first`,
        );
      }

      removeFromParent(located);
      changes.push({ kind: "remove", widgetName: operation.name });
      continue;
    }

    if (operation.kind === "resize") {
      applyResize(dsl, located, operation, changes, notes);
      continue;
    }

    applyMove(dsl, widgets, located, operation, changes, notes);
  }

  return { dsl, changes, notes };
}

type MoveOperation = Extract<WidgetPatchOperation, { kind: "move" }>;
type ResizeOperation = Extract<WidgetPatchOperation, { kind: "resize" }>;

// Collision-aware move (design section B). Explicit positions are honored when free; a collision is repaired to
// the nearest free spot below (recorded as requestedPosition vs position, plus a note) or rejected under
// strict: true. Reparenting is occupancy-aware: the landing position in the new canvas is always server-computed
// and recorded — a deliberate semantic change from the old "keep the coordinates blindly" behavior.
function applyMove(
  dsl: WidgetNode,
  widgets: Map<string, LocatedWidget>,
  located: LocatedWidget,
  operation: MoveOperation,
  changes: WidgetPatchChange[],
  notes: string[],
): void {
  const strict = operation.strict === true;
  const previousParentWidgetName = located.parent?.widgetName;
  const previousPosition = positionOf(located.node);
  let parentWidgetName = previousParentWidgetName;
  let destinationCanvas = located.parent;
  const reparented = operation.parent !== undefined;

  if (operation.parent !== undefined) {
    const target = widgets.get(operation.parent);
    const destination = target && directCanvas(target.node);

    if (!target || !destination) {
      throw new Error(
        `parent "${operation.parent}" must name a canvas or widget with an inner canvas`,
      );
    }

    if (
      destination.widgetId === located.node.widgetId ||
      isDescendant(located.node, destination)
    ) {
      throw new Error(
        `widget "${operation.name}" cannot be parented to itself`,
      );
    }

    // M6 modal discipline (structural): a modal — or a subtree smuggling one — may not move under another
    // modal's canvas. Modals are page-level overlays; stacking is an event-graph concern, not a nesting one.
    if (
      containsModal(located.node) &&
      (target.node.type === "MODAL_WIDGET" ||
        hostModalOf(dsl, String(target.node.widgetName)) !== PAGE_HOST)
    ) {
      throw new Error(
        `cannot move "${operation.name}" into "${operation.parent}": it contains a modal, and a modal cannot ` +
          "live inside another modal. Keep modals at the page level and open them with a wire_event showModal action",
      );
    }

    removeFromParent(located);
    destination.children = destination.children ?? [];
    destination.children.push(located.node);
    located.node.parentId = destination.widgetId;
    parentWidgetName = target.node.widgetName;
    destinationCanvas = destination;
  }

  // Detached overlays (modals) are not in-flow: no occupancy, no cascade — apply the position directly.
  if (isDetached(located.node)) {
    if (operation.position !== undefined) {
      applyPosition(located.node, operation.position);
    }

    changes.push({
      kind: "move",
      widgetName: operation.name,
      ...(reparented ? { previousParentWidgetName, parentWidgetName } : {}),
      ...(operation.position !== undefined
        ? { previousPosition, position: positionOf(located.node) }
        : {}),
    });

    return;
  }

  const rect = rectOf(located.node);

  if (!rect) {
    throw new Error(
      `widget "${operation.name}" has a non-numeric position and cannot be moved safely`,
    );
  }

  if (!destinationCanvas || destinationCanvas.type !== "CANVAS_WIDGET") {
    throw new Error(`widget "${operation.name}" is not on a canvas`);
  }

  const columns = canvasColumns(destinationCanvas);
  const rows = rect.bottomRow - rect.topRow;
  let width = rect.rightColumn - rect.leftColumn;

  if (rows <= 0 || width <= 0) {
    throw new Error(
      `widget "${operation.name}" has a non-positive size and cannot be moved safely`,
    );
  }

  if (width > columns) {
    notes.push(
      `"${operation.name}" (${width} columns) is wider than "${parentWidgetName}" (${columns} columns); its width was reduced to fit`,
    );
    width = columns;
  }

  // Self-exclusion by node identity (not widgetId) so a corrupt duplicated-id tree cannot misroute the repair.
  const siblings = (destinationCanvas.children ?? []).filter(
    (child) => child !== located.node,
  );
  const requested: Position = operation.position ?? {
    topRow: rect.topRow,
    leftColumn: rect.leftColumn,
  };
  let landing: Position;
  let requestedPosition: Position | undefined;

  if (operation.position !== undefined) {
    // An explicit position past the right edge would place the widget off-canvas (only the off-grid lint would
    // notice); clamp it so the widget's right edge stays within the 64-column canvas, and record the repair.
    const maxLeft = Math.max(0, columns - width);
    const original: Position = { ...requested };

    if (requested.leftColumn > maxLeft) {
      if (strict) {
        throw new Error(
          `moving "${operation.name}" to ${formatPosition(requested)} puts it past the canvas edge; the largest leftColumn that fits its ${width} columns is ${maxLeft}`,
        );
      }

      notes.push(
        `"${operation.name}" was requested at leftColumn ${requested.leftColumn}, past the canvas edge; placed at ${maxLeft} so its ${width} columns fit`,
      );
      requested.leftColumn = maxLeft;
      // The change record reports what the agent asked for, as the tool description promises.
      requestedPosition = original;
    }

    const targetRect: Rect = {
      topRow: requested.topRow,
      bottomRow: requested.topRow + rows,
      leftColumn: requested.leftColumn,
      rightColumn: requested.leftColumn + width,
    };
    const colliders = collisions(siblings, targetRect);

    if (colliders.length === 0) {
      landing = requested;
    } else if (strict) {
      const free = nearestFreePosition(
        siblings,
        { rows, columns: width },
        requested,
        columns,
      );

      throw new Error(
        `moving "${operation.name}" to ${formatPosition(requested)} would overlap ${formatNames(colliders)}; nearest free position is ${formatPosition(free)}`,
      );
    } else {
      landing = nearestFreePosition(
        siblings,
        { rows, columns: width },
        requested,
        columns,
      );
      requestedPosition = original;
      notes.push(
        `"${operation.name}": requested position ${formatPosition(requested)} overlaps ${formatNames(colliders)}; placed at ${formatPosition(landing)} instead`,
      );
    }
  } else {
    // Reparent without an explicit position: land at the nearest free spot to the old coordinates in the NEW canvas.
    landing = nearestFreePosition(
      siblings,
      { rows, columns: width },
      requested,
      columns,
    );
  }

  applyPosition(located.node, landing, width);

  changes.push({
    kind: "move",
    widgetName: operation.name,
    ...(reparented ? { previousParentWidgetName, parentWidgetName } : {}),
    previousPosition,
    position: positionOf(located.node),
    ...(requestedPosition !== undefined ? { requestedPosition } : {}),
  });

  // Container-fit cascade (D): grow the enclosing container chain to the widget's new extent, pushing anything
  // displaced further down. No-op when the landing fits.
  mergeCascade(changes, notes, cascadeFit(dsl, operation.name));
}

// The resize operation (design section B2), in grid units. Growth cascade-pushes colliding below-siblings
// (strict: true rejects); width cannot exceed the canvas (no horizontal reflow in v1); container-likes may not
// shrink below their children's occupied extent (the rejection names the executable minimum). Modal heights are a
// pixel prop: rows are translated via the grid's row height, and an over-tall body warns (the modal scrolls).
function applyResize(
  dsl: WidgetNode,
  located: LocatedWidget,
  operation: ResizeOperation,
  changes: WidgetPatchChange[],
  notes: string[],
): void {
  const strict = operation.strict === true;
  const node = located.node;

  if (node.type === "MODAL_WIDGET") {
    if (operation.columns !== undefined) {
      throw new Error(
        `modal "${operation.name}" width cannot be resized in grid columns; set rows only (height = rows × ${ROW_HEIGHT}px)`,
      );
    }

    const rows = operation.rows!;
    const previousHeight = isNumber(node.height) ? node.height : undefined;

    node.height = rows * ROW_HEIGHT;

    let extent = 0;

    for (const inner of innerCanvasesOf(node)) {
      extent = Math.max(extent, contentExtent(inner));
    }

    notes.push(
      `modal "${operation.name}" height set to ${rows * ROW_HEIGHT}px (${rows} rows × ${ROW_HEIGHT}px)`,
    );

    if (extent > rows) {
      notes.push(
        `modal "${operation.name}" body content is ${extent} rows; at ${rows} rows it will scroll`,
      );
    }

    changes.push({
      kind: "resize",
      widgetName: operation.name,
      ...(previousHeight !== undefined
        ? { previousSize: { rows: Math.round(previousHeight / ROW_HEIGHT) } }
        : {}),
      size: { rows },
    });

    return;
  }

  const rect = rectOf(node);

  if (!rect) {
    throw new Error(
      `widget "${operation.name}" has a non-numeric position and cannot be resized safely`,
    );
  }

  const canvas = located.parent;

  if (!canvas || canvas.type !== "CANVAS_WIDGET") {
    throw new Error(`widget "${operation.name}" is not on a canvas`);
  }

  const columns = canvasColumns(canvas);
  const currentRows = rect.bottomRow - rect.topRow;
  const currentColumns = rect.rightColumn - rect.leftColumn;
  const targetRows = operation.rows ?? Math.max(1, currentRows);
  const targetColumns = operation.columns ?? Math.max(1, currentColumns);

  // No horizontal reflow in v1: width growth past the canvas is rejected with the available room.
  if (rect.leftColumn + targetColumns > columns) {
    throw new Error(
      `resizing "${operation.name}" to ${targetColumns} columns exceeds its canvas: ${Math.max(0, columns - rect.leftColumn)} columns are available from leftColumn ${rect.leftColumn}`,
    );
  }

  // A container/form/tabs may not shrink below its children's occupied ROW extent — reject with the executable
  // minimum. Columns are not constrained by the children: they live in the inner canvas's own 64-column grid, which
  // the client scales to whatever pixel width the container has, so a 24-column container holds full-width fields.
  const innerCanvases = innerCanvasesOf(node);

  if (innerCanvases.length > 0) {
    let minRows = 0;

    for (const inner of innerCanvases) {
      minRows = Math.max(minRows, contentExtent(inner));
    }

    if (operation.rows !== undefined && targetRows < minRows) {
      throw new Error(
        `cannot shrink "${operation.name}" to ${targetRows} rows; smallest rows that fit the children: ${minRows}`,
      );
    }
  }

  // strict: reject growth that would land on siblings the widget does not already touch.
  const targetRect: Rect = {
    topRow: rect.topRow,
    bottomRow: rect.topRow + targetRows,
    leftColumn: rect.leftColumn,
    rightColumn: rect.leftColumn + targetColumns,
  };
  const siblings = (canvas.children ?? []).filter((child) => child !== node);
  const alreadyColliding = new Set(collisions(siblings, rect));
  const newColliders = collisions(siblings, targetRect).filter(
    (name) => !alreadyColliding.has(name),
  );

  if (newColliders.length > 0 && strict) {
    throw new Error(
      `resizing "${operation.name}" to ${targetRows} rows × ${targetColumns} columns would overlap ${formatNames(newColliders)}; retry without strict to push them down, or pick a smaller size`,
    );
  }

  // Write hygiene: rows derive from the clamped topRow (same contract as applyPosition — the span is never
  // distorted); the column write is bounded by the canvas check above.
  node.bottomRow = clampRow(rect.topRow) + targetRows;
  node.rightColumn = Math.max(0, Math.round(rect.leftColumn)) + targetColumns;
  syncMobileRows(node);

  // Keep the inner canvas's row extent in step with the container's body (build invariant: the canvas spans the
  // container). Its rightColumn is NOT the container's span: the client rewrites it with the pixel width at render
  // and the build invariant is the 64-column grid, so it is left alone.
  for (const inner of innerCanvasesOf(node)) {
    if (isNumber(inner.bottomRow)) {
      inner.bottomRow = Math.max(targetRows, contentExtent(inner));
    }
  }

  changes.push({
    kind: "resize",
    widgetName: operation.name,
    previousSize: { rows: currentRows, columns: currentColumns },
    size: { rows: targetRows, columns: targetColumns },
  });

  if (newColliders.length > 0) {
    notes.push(
      `resizing "${operation.name}" grew it into ${formatNames(newColliders)}; they were pushed down`,
    );
  }

  // Cascade (D): push displaced siblings down and grow the ancestor chain; the delta gate verifies the final result.
  mergeCascade(changes, notes, cascadeFit(dsl, operation.name));
}
