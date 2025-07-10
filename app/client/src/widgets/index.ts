import type BaseWidget from "./BaseWidget";
import { retryPromise } from "utils/AppsmithUtils";
import { anvilWidgets } from "./wds/constants";
import { EEWDSWidgets } from "ee/widgets/wds";
import { EEWidgets } from "ee/widgets";

// Create widget loader map
const WidgetLoaders = new Map<string, () => Promise<typeof BaseWidget>>([
  ...EEWDSWidgets,
  ...EEWidgets,
  // WDS Widgets
  [
    "WDS_BUTTON_WIDGET",
    async () =>
      import("widgets/wds/WDSButtonWidget").then((m) => m.WDSButtonWidget),
  ],
  [
    "WDS_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSInputWidget").then((m) => m.WDSInputWidget),
  ],
  [
    "WDS_CHECKBOX_WIDGET",
    async () =>
      import("widgets/wds/WDSCheckboxWidget").then((m) => m.WDSCheckboxWidget),
  ],
  [
    "WDS_ICON_BUTTON_WIDGET",
    async () =>
      import("widgets/wds/WDSIconButtonWidget").then(
        (m) => m.WDSIconButtonWidget,
      ),
  ],
  [
    "WDS_TABLE_WIDGET",
    async () =>
      import("widgets/wds/WDSTableWidget").then((m) => m.WDSTableWidget),
  ],
  [
    "WDS_CURRENCY_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSCurrencyInputWidget").then(
        (m) => m.WDSCurrencyInputWidget,
      ),
  ],
  [
    "WDS_TOOLBAR_BUTTONS_WIDGET",
    async () =>
      import("widgets/wds/WDSToolbarButtonsWidget").then(
        (m) => m.WDSToolbarButtonsWidget,
      ),
  ],
  [
    "WDS_PHONE_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSPhoneInputWidget").then(
        (m) => m.WDSPhoneInputWidget,
      ),
  ],
  [
    "WDS_CHECKBOX_GROUP_WIDGET",
    async () =>
      import("widgets/wds/WDSCheckboxGroupWidget").then(
        (m) => m.WDSCheckboxGroupWidget,
      ),
  ],
  [
    "WDS_COMBO_BOX_WIDGET",
    async () =>
      import("widgets/wds/WDSComboBoxWidget").then((m) => m.WDSComboBoxWidget),
  ],
  [
    "WDS_SWITCH_WIDGET",
    async () =>
      import("widgets/wds/WDSSwitchWidget").then((m) => m.WDSSwitchWidget),
  ],
  [
    "WDS_SWITCH_GROUP_WIDGET",
    async () =>
      import("widgets/wds/WDSSwitchGroupWidget").then(
        (m) => m.WDSSwitchGroupWidget,
      ),
  ],
  [
    "WDS_RADIO_GROUP_WIDGET",
    async () =>
      import("widgets/wds/WDSRadioGroupWidget").then(
        (m) => m.WDSRadioGroupWidget,
      ),
  ],
  [
    "WDS_MENU_BUTTON_WIDGET",
    async () =>
      import("widgets/wds/WDSMenuButtonWidget").then(
        (m) => m.WDSMenuButtonWidget,
      ),
  ],
  [
    "CUSTOM_WIDGET",
    async () => import("./CustomWidget").then((m) => m.default),
  ],
  [
    anvilWidgets.SECTION_WIDGET,
    async () =>
      import("widgets/wds/WDSSectionWidget").then((m) => m.WDSSectionWidget),
  ],
  [
    anvilWidgets.ZONE_WIDGET,
    async () =>
      import("widgets/wds/WDSZoneWidget").then((m) => m.WDSZoneWidget),
  ],
  [
    "WDS_PARAGRAPH_WIDGET",
    async () =>
      import("widgets/wds/WDSParagraphWidget").then(
        (m) => m.WDSParagraphWidget,
      ),
  ],
  [
    "WDS_HEADING_WIDGET",
    async () =>
      import("widgets/wds/WDSHeadingWidget").then((m) => m.WDSHeadingWidget),
  ],
  [
    "WDS_MODAL_WIDGET",
    async () =>
      import("widgets/wds/WDSModalWidget").then((m) => m.WDSModalWidget),
  ],
  [
    "WDS_STATS_WIDGET",
    async () =>
      import("widgets/wds/WDSStatsWidget").then((m) => m.WDSStatsWidget),
  ],
  [
    "WDS_KEY_VALUE_WIDGET",
    async () =>
      import("widgets/wds/WDSKeyValueWidget").then((m) => m.WDSKeyValueWidget),
  ],
  [
    "WDS_INLINE_BUTTONS_WIDGET",
    async () =>
      import("widgets/wds/WDSInlineButtonsWidget").then(
        (m) => m.WDSInlineButtonsWidget,
      ),
  ],
  [
    "WDS_EMAIL_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSEmailInputWidget").then(
        (m) => m.WDSEmailInputWidget,
      ),
  ],
  [
    "WDS_PASSWORD_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSPasswordInputWidget").then(
        (m) => m.WDSPasswordInputWidget,
      ),
  ],
  [
    "WDS_NUMBER_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSNumberInputWidget").then(
        (m) => m.WDSNumberInputWidget,
      ),
  ],
  [
    "WDS_MULTILINE_INPUT_WIDGET",
    async () =>
      import("widgets/wds/WDSMultilineInputWidget").then(
        (m) => m.WDSMultilineInputWidget,
      ),
  ],
  [
    "WDS_SELECT_WIDGET",
    async () =>
      import("widgets/wds/WDSSelectWidget").then((m) => m.WDSSelectWidget),
  ],
  [
    "WDS_DATEPICKER_WIDGET",
    async () =>
      import("widgets/wds/WDSDatePickerWidget").then(
        (m) => m.WDSDatePickerWidget,
      ),
  ],
  [
    "WDS_MULTI_SELECT_WIDGET",
    async () =>
      import("widgets/wds/WDSMultiSelectWidget").then(
        (m) => m.WDSMultiSelectWidget,
      ),
  ],

  // Legacy Widgets
  [
    "CANVAS_WIDGET",
    async () => import("./CanvasWidget").then((m) => m.default),
  ],
  [
    "SKELETON_WIDGET",
    async () => import("./SkeletonWidget").then((m) => m.default),
  ],
  [
    "CONTAINER_WIDGET",
    async () => import("./ContainerWidget").then((m) => m.default),
  ],
  ["TEXT_WIDGET", async () => import("./TextWidget").then((m) => m.default)],
  ["TABLE_WIDGET", async () => import("./TableWidget").then((m) => m.default)],
  [
    "CHECKBOX_WIDGET",
    async () => import("./CheckboxWidget").then((m) => m.default),
  ],
  [
    "RADIO_GROUP_WIDGET",
    async () => import("./RadioGroupWidget").then((m) => m.default),
  ],
  [
    "BUTTON_WIDGET",
    async () => import("./ButtonWidget").then((m) => m.default),
  ],
  ["IMAGE_WIDGET", async () => import("./ImageWidget").then((m) => m.default)],
  ["VIDEO_WIDGET", async () => import("./VideoWidget").then((m) => m.default)],
  ["TABS_WIDGET", async () => import("./TabsWidget").then((m) => m.default)],
  ["MODAL_WIDGET", async () => import("./ModalWidget").then((m) => m.default)],
  ["CHART_WIDGET", async () => import("./ChartWidget").then((m) => m.default)],
  ["MAP_WIDGET", async () => import("./MapWidget").then((m) => m.default)],
  [
    "RICH_TEXT_EDITOR_WIDGET",
    async () => import("./RichTextEditorWidget").then((m) => m.default),
  ],
  [
    "DATE_PICKER_WIDGET2",
    async () => import("./DatePickerWidget2").then((m) => m.default),
  ],
  [
    "SWITCH_WIDGET",
    async () => import("./SwitchWidget").then((m) => m.default),
  ],
  ["FORM_WIDGET", async () => import("./FormWidget").then((m) => m.default)],
  ["RATE_WIDGET", async () => import("./RateWidget").then((m) => m.default)],
  [
    "IFRAME_WIDGET",
    async () => import("./IframeWidget").then((m) => m.default),
  ],
  [
    "TABS_MIGRATOR_WIDGET",
    async () => import("./TabsMigrator").then((m) => m.default),
  ],
  [
    "DIVIDER_WIDGET",
    async () => import("./DividerWidget").then((m) => m.default),
  ],
  [
    "MENU_BUTTON_WIDGET",
    async () => import("./MenuButtonWidget").then((m) => m.default),
  ],
  [
    "ICON_BUTTON_WIDGET",
    async () => import("./IconButtonWidget").then((m) => m.default),
  ],
  [
    "CHECKBOX_GROUP_WIDGET",
    async () => import("./CheckboxGroupWidget").then((m) => m.default),
  ],
  [
    "FILE_PICKER_WIDGET_V2",
    async () => import("./FilePickerWidgetV2").then((m) => m.default),
  ],
  [
    "STATBOX_WIDGET",
    async () => import("./StatboxWidget").then((m) => m.default),
  ],
  [
    "AUDIO_RECORDER_WIDGET",
    async () => import("./AudioRecorderWidget").then((m) => m.default),
  ],
  [
    "DOCUMENT_VIEWER_WIDGET",
    async () => import("./DocumentViewerWidget").then((m) => m.default),
  ],
  [
    "BUTTON_GROUP_WIDGET",
    async () => import("./ButtonGroupWidget").then((m) => m.default),
  ],
  [
    "WDS_CUSTOM_WIDGET",
    async () =>
      import("widgets/wds/WDSCustomWidget").then((m) => m.WDSCustomWidget),
  ],
  [
    "MULTI_SELECT_TREE_WIDGET",
    async () => import("./MultiSelectTreeWidget").then((m) => m.default),
  ],
  [
    "SINGLE_SELECT_TREE_WIDGET",
    async () => import("./SingleSelectTreeWidget").then((m) => m.default),
  ],
  [
    "SWITCH_GROUP_WIDGET",
    async () => import("./SwitchGroupWidget").then((m) => m.default),
  ],
  ["AUDIO_WIDGET", async () => import("./AudioWidget").then((m) => m.default)],
  [
    "PROGRESSBAR_WIDGET",
    async () => import("./ProgressBarWidget").then((m) => m.default),
  ],
  [
    "CAMERA_WIDGET",
    async () => import("./CameraWidget").then((m) => m.default),
  ],
  [
    "MAP_CHART_WIDGET",
    async () => import("./MapChartWidget").then((m) => m.default),
  ],
  [
    "SELECT_WIDGET",
    async () => import("./SelectWidget").then((m) => m.default),
  ],
  [
    "MULTI_SELECT_WIDGET_V2",
    async () => import("./MultiSelectWidgetV2").then((m) => m.default),
  ],
  [
    "MULTI_SELECT_WIDGET",
    async () => import("./MultiSelectWidget").then((m) => m.default),
  ],
  [
    "INPUT_WIDGET_V2",
    async () => import("./InputWidgetV2").then((m) => m.default),
  ],
  [
    "PHONE_INPUT_WIDGET",
    async () => import("./PhoneInputWidget").then((m) => m.default),
  ],
  [
    "CURRENCY_INPUT_WIDGET",
    async () => import("./CurrencyInputWidget").then((m) => m.default),
  ],
  [
    "JSON_FORM_WIDGET",
    async () => import("./JSONFormWidget").then((m) => m.default),
  ],
  [
    "TABLE_WIDGET_V2",
    async () => import("./TableWidgetV2").then((m) => m.default),
  ],
  [
    "NUMBER_SLIDER_WIDGET",
    async () => import("./NumberSliderWidget").then((m) => m.default),
  ],
  [
    "RANGE_SLIDER_WIDGET",
    async () => import("./RangeSliderWidget").then((m) => m.default),
  ],
  [
    "CATEGORY_SLIDER_WIDGET",
    async () => import("./CategorySliderWidget").then((m) => m.default),
  ],
  [
    "CODE_SCANNER_WIDGET",
    async () => import("./CodeScannerWidget").then((m) => m.default),
  ],
  [
    "LIST_WIDGET_V2",
    async () => import("./ListWidgetV2").then((m) => m.default),
  ],
  [
    "EXTERNAL_WIDGET",
    async () => import("./ExternalWidget").then((m) => m.default),
  ],

  // Deprecated Widgets
  [
    "DROP_DOWN_WIDGET",
    async () => import("./DropdownWidget").then((m) => m.default),
  ],
  ["ICON_WIDGET", async () => import("./IconWidget").then((m) => m.default)],
  [
    "FILE_PICKER_WIDGET",
    async () => import("./FilepickerWidget").then((m) => m.default),
  ],
  [
    "FORM_BUTTON_WIDGET",
    async () => import("./FormButtonWidget").then((m) => m.default),
  ],
  [
    "PROGRESS_WIDGET",
    async () => import("./ProgressWidget").then((m) => m.default),
  ],
  [
    "CIRCULAR_PROGRESS_WIDGET",
    async () => import("./CircularProgressWidget").then((m) => m.default),
  ],
  ["LIST_WIDGET", async () => import("./ListWidget").then((m) => m.default)],
  [
    "DATE_PICKER_WIDGET",
    async () => import("./DatePickerWidget").then((m) => m.default),
  ],
  ["INPUT_WIDGET", async () => import("./InputWidget").then((m) => m.default)],
]);

// Cache for loaded widgets
const loadedWidgets = new Map<string, typeof BaseWidget>();

// Function to load a specific widget by type
export const loadWidget = async (type: string): Promise<typeof BaseWidget> => {
  if (loadedWidgets.has(type)) {
    return loadedWidgets.get(type)!;
  }

  const loader = WidgetLoaders.get(type);

  if (!loader) {
    throw new Error(`Widget type ${type} not found`);
  }

  try {
    const widget = await retryPromise(async () => loader());

    loadedWidgets.set(type, widget);

    return widget;
  } catch (error) {
    throw new Error(`Error loading widget ${type}:` + error);
  }
};

// Function to load all widgets
// Function to load all widgets
export const loadAllWidgets = async (): Promise<
  Map<string, typeof BaseWidget>
> => {
  const allWidgets = new Map<string, typeof BaseWidget>();

  const widgetPromises = Array.from(WidgetLoaders.entries()).map(
    async ([type, loader]) => {
      if (loadedWidgets.has(type)) {
        return [type, loadedWidgets.get(type)!] as [string, typeof BaseWidget];
      }

      try {
        const widget = await retryPromise(async () => loader());

        loadedWidgets.set(type, widget);

        return [type, widget] as [string, typeof BaseWidget];
      } catch (error) {
        throw new Error(
          `Failed to load widget type ${type}: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
  );

  const loadedWidgetEntries = await Promise.all(widgetPromises);

  for (const [type, widget] of loadedWidgetEntries) {
    allWidgets.set(type, widget);
  }

  return allWidgets;
};
export default WidgetLoaders;
