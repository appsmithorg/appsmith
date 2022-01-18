import { registerWidget, WidgetConfiguration } from "./WidgetRegisterHelpers";
import CanvasWidget, {
  CONFIG as CANVAS_WIDGET_CONFIG,
} from "widgets/CanvasWidget";
import SkeletonWidget, {
  CONFIG as SKELETON_WIDGET_CONFIG,
} from "widgets/SkeletonWidget";
import TextWidget, { CONFIG as TEXT_WIDGET_CONFIG } from "widgets/TextWidget";
import TableWidget, {
  CONFIG as TABLE_WIDGET_CONFIG,
} from "widgets/TableWidget";
import ContainerWidget, {
  CONFIG as CONTAINER_WIDGET_CONFIG,
} from "widgets/ContainerWidget";
import CheckboxWidget, {
  CONFIG as CHECKBOX_WIDGET_CONFIG,
} from "widgets/CheckboxWidget";
import RadioGroupWidget, {
  CONFIG as RADIO_GROUP_WIDGET_CONFIG,
} from "widgets/RadioGroupWidget";
import ButtonWidget, {
  CONFIG as BUTTON_WIDGET_CONFIG,
} from "widgets/ButtonWidget";
import DropdownWidget, {
  CONFIG as DROPDOWN_WIDGET_CONFIG,
} from "widgets/DropdownWidget";
import ImageWidget, {
  CONFIG as IMAGE_WIDGET_CONFIG,
} from "widgets/ImageWidget";
import VideoWidget, {
  CONFIG as VIDEO_WIDGET_CONFIG,
} from "widgets/VideoWidget";
import TabsWidget, { CONFIG as TABS_WIDGET_CONFIG } from "widgets/TabsWidget";
import InputWidget, {
  CONFIG as INPUT_WIDGET_CONFIG,
} from "widgets/InputWidget";
import ModalWidget, {
  CONFIG as MODAL_WIDGET_CONFIG,
} from "widgets/ModalWidget";
import ChartWidget, {
  CONFIG as CHART_WIDGET_CONFIG,
} from "widgets/ChartWidget";
import MapWidget, { CONFIG as MAP_WIDGET_CONFIG } from "widgets/MapWidget";
import FilePickerWidget, {
  CONFIG as FILEPICKER_WIDGET_CONFIG,
} from "widgets/FilepickerWidget";
import RichTextEditorWidget, {
  CONFIG as RICH_TEXT_EDITOR_WIDGET_CONFIG,
} from "widgets/RichTextEditorWidget";
import DatePickerWidget, {
  CONFIG as DATE_PICKER_WIDGET_CONFIG,
} from "widgets/DatePickerWidget";
import DatePickerWidget2, {
  CONFIG as DATE_PICKER_WIDGET_2_CONFIG,
} from "widgets/DatePickerWidget2";
import ListWidget, { CONFIG as LIST_WIDGET_CONFIG } from "widgets/ListWidget";
import SwitchWidget, {
  CONFIG as SWITCH_WIDGET_CONFIG,
} from "widgets/SwitchWidget";
import DividerWidget, {
  CONFIG as DIVIDER_WIDGET_CONFIG,
} from "widgets/DividerWidget";
import TabsMigratorWidget, {
  CONFIG as TABS_MIGRATOR_WIDGET_CONFIG,
} from "widgets/TabsMigrator";
import RateWidget, { CONFIG as RATE_WIDGET_CONFIG } from "widgets/RateWidget";
import IframeWidget, {
  CONFIG as IFRAME_WIDGET_CONFIG,
} from "widgets/IframeWidget";
import MenuButtonWidget, {
  CONFIG as MENU_BUTTON_WIDGET_CONFIG,
} from "widgets/MenuButtonWidget";
import MultiSelectWidget, {
  CONFIG as MULTI_SELECT_WIDGET_CONFIG,
} from "widgets/MultiSelectWidget";
import FormWidget, { CONFIG as FORM_WIDGET_CONFIG } from "widgets/FormWidget";
import FormButtonWidget, {
  CONFIG as FORM_BUTTON_WIDGET_CONFIG,
} from "widgets/FormButtonWidget";
import IconWidget, { CONFIG as ICON_WIDGET_CONFIG } from "widgets/IconWidget";
import IconButtonWidget, {
  CONFIG as ICON_BUTTON_WIDGET_CONFIG,
} from "widgets/IconButtonWidget";
import CheckboxGroupWidget, {
  CONFIG as CHECKBOX_GROUP_WIDGET_CONFIG,
} from "widgets/CheckboxGroupWidget";
import StatboxWidget, {
  CONFIG as STATBOX_WIDGET_CONFIG,
} from "widgets/StatboxWidget";
import FilePickerWidgetV2, {
  CONFIG as FILEPICKER_WIDGET_V2_CONFIG,
} from "widgets/FilePickerWidgetV2";
import AudioWidget, {
  CONFIG as AUDIO_WIDGET_CONFIG,
} from "widgets/AudioWidget";
import AudioRecorderWidget, {
  CONFIG as AUDIO_RECORDER_WIDGET_CONFIG,
} from "widgets/AudioRecorderWidget";
import DocumentViewerWidget, {
  CONFIG as DOCUMENT_VIEWER_WIDGET_CONFIG,
} from "widgets/DocumentViewerWidget";
import ButtonGroupWidget, {
  CONFIG as BUTTON_GROUP_CONFIG,
} from "widgets/ButtonGroupWidget";
import SingleSelectTreeWidget, {
  CONFIG as SINGLE_SELECT_TREE_WIDGET_CONFIG,
} from "widgets/SingleSelectTreeWidget";
import MultiSelectTreeWidget, {
  CONFIG as MULTI_SELECT_TREE_WIDGET_CONFIG,
} from "widgets/MultiSelectTreeWidget";
import ProgressBarWidget, {
  CONFIG as PROGRESSBAR_WIDGET_CONFIG,
} from "widgets/ProgressBarWidget";
import SwitchGroupWidget, {
  CONFIG as SWITCH_GROUP_WIDGET_CONFIG,
} from "widgets/SwitchGroupWidget";
import InputWidgetV2, {
  CONFIG as INPUT_WIDGET_V2_CONFIG,
} from "widgets/InputWidgetV2";
import PhoneInputWidget, {
  CONFIG as PHONE_INPUT_WIDGET_V2_CONFIG,
} from "widgets/PhoneInputWidget";
import CurrencyInputWidget, {
  CONFIG as CURRENCY_INPUT_WIDGET_V2_CONFIG,
} from "widgets/CurrencyInputWidget";

import CameraWidget, {
  CONFIG as CAMERA_WIDGET_CONFIG,
} from "widgets/CameraWidget";
import MapChartWidget, {
  CONFIG as MAP_CHART_WIDGET_CONFIG,
} from "widgets/MapChartWidget";

import log from "loglevel";

export const ALL_WDIGETS_AND_CONFIG = [
  [CanvasWidget, CANVAS_WIDGET_CONFIG],
  [SkeletonWidget, SKELETON_WIDGET_CONFIG],
  [ContainerWidget, CONTAINER_WIDGET_CONFIG],
  [TextWidget, TEXT_WIDGET_CONFIG],
  [TableWidget, TABLE_WIDGET_CONFIG],
  [CheckboxWidget, CHECKBOX_WIDGET_CONFIG],
  [RadioGroupWidget, RADIO_GROUP_WIDGET_CONFIG],
  [ButtonWidget, BUTTON_WIDGET_CONFIG],
  [DropdownWidget, DROPDOWN_WIDGET_CONFIG],
  [ImageWidget, IMAGE_WIDGET_CONFIG],
  [VideoWidget, VIDEO_WIDGET_CONFIG],
  [TabsWidget, TABS_WIDGET_CONFIG],
  [InputWidget, INPUT_WIDGET_CONFIG],
  [ModalWidget, MODAL_WIDGET_CONFIG],
  [ChartWidget, CHART_WIDGET_CONFIG],
  [MapWidget, MAP_WIDGET_CONFIG],
  [FilePickerWidget, FILEPICKER_WIDGET_CONFIG],
  [RichTextEditorWidget, RICH_TEXT_EDITOR_WIDGET_CONFIG],
  [DatePickerWidget, DATE_PICKER_WIDGET_CONFIG],
  [DatePickerWidget2, DATE_PICKER_WIDGET_2_CONFIG],
  [SwitchWidget, SWITCH_WIDGET_CONFIG],
  [FormWidget, FORM_WIDGET_CONFIG],
  [FormButtonWidget, FORM_BUTTON_WIDGET_CONFIG],
  [IconWidget, ICON_WIDGET_CONFIG],
  [ListWidget, LIST_WIDGET_CONFIG],
  [RateWidget, RATE_WIDGET_CONFIG],
  [IframeWidget, IFRAME_WIDGET_CONFIG],
  [TabsMigratorWidget, TABS_MIGRATOR_WIDGET_CONFIG],
  [DividerWidget, DIVIDER_WIDGET_CONFIG],
  [MenuButtonWidget, MENU_BUTTON_WIDGET_CONFIG],
  [MultiSelectWidget, MULTI_SELECT_WIDGET_CONFIG],
  [IconButtonWidget, ICON_BUTTON_WIDGET_CONFIG],
  [CheckboxGroupWidget, CHECKBOX_GROUP_WIDGET_CONFIG],
  [FilePickerWidgetV2, FILEPICKER_WIDGET_V2_CONFIG],
  [StatboxWidget, STATBOX_WIDGET_CONFIG],
  [AudioRecorderWidget, AUDIO_RECORDER_WIDGET_CONFIG],
  [DocumentViewerWidget, DOCUMENT_VIEWER_WIDGET_CONFIG],
  [ButtonGroupWidget, BUTTON_GROUP_CONFIG],
  [MultiSelectTreeWidget, MULTI_SELECT_TREE_WIDGET_CONFIG],
  [SingleSelectTreeWidget, SINGLE_SELECT_TREE_WIDGET_CONFIG],
  [SwitchGroupWidget, SWITCH_GROUP_WIDGET_CONFIG],
  [AudioWidget, AUDIO_WIDGET_CONFIG],
  [ProgressBarWidget, PROGRESSBAR_WIDGET_CONFIG],
  [CameraWidget, CAMERA_WIDGET_CONFIG],
  [MapChartWidget, MAP_CHART_WIDGET_CONFIG],
  [InputWidgetV2, INPUT_WIDGET_V2_CONFIG],
  [PhoneInputWidget, PHONE_INPUT_WIDGET_V2_CONFIG],
  [CurrencyInputWidget, CURRENCY_INPUT_WIDGET_V2_CONFIG],
];

export const registerWidgets = () => {
  const start = performance.now();
  for (const widget of ALL_WDIGETS_AND_CONFIG) {
    registerWidget(widget[0], widget[1] as WidgetConfiguration);
  }

  log.debug("Widget registration took: ", performance.now() - start, "ms");
};
