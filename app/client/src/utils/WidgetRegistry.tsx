import log from "loglevel";
import AudioRecorderWidget, {
  CONFIG as AUDIO_RECORDER_WIDGET_CONFIG,
} from "widgets/AudioRecorderWidget";
import AudioWidget, {
  CONFIG as AUDIO_WIDGET_CONFIG,
} from "widgets/AudioWidget";
import ButtonGroupWidget, {
  CONFIG as BUTTON_GROUP_CONFIG,
} from "widgets/ButtonGroupWidget";
import ButtonWidget, {
  CONFIG as BUTTON_WIDGET_CONFIG,
} from "widgets/ButtonWidget";
import SelectWidget, {
  CONFIG as SELECT_WIDGET_CONFIG,
} from "widgets/SelectWidget";
import CameraWidget, {
  CONFIG as CAMERA_WIDGET_CONFIG,
} from "widgets/CameraWidget";
import CanvasWidget, {
  CONFIG as CANVAS_WIDGET_CONFIG,
} from "widgets/CanvasWidget";
import ChartWidget, {
  CONFIG as CHART_WIDGET_CONFIG,
} from "widgets/ChartWidget";
import CheckboxGroupWidget, {
  CONFIG as CHECKBOX_GROUP_WIDGET_CONFIG,
} from "widgets/CheckboxGroupWidget";
import CheckboxWidget, {
  CONFIG as CHECKBOX_WIDGET_CONFIG,
} from "widgets/CheckboxWidget";
import CircularProgressWidget, {
  CONFIG as CIRCULAR_PROGRESS_WIDGET_CONFIG,
} from "widgets/CircularProgressWidget";
import ContainerWidget, {
  CONFIG as CONTAINER_WIDGET_CONFIG,
} from "widgets/ContainerWidget";
import CurrencyInputWidget, {
  CONFIG as CURRENCY_INPUT_WIDGET_V2_CONFIG,
} from "widgets/CurrencyInputWidget";
import DatePickerWidget, {
  CONFIG as DATE_PICKER_WIDGET_CONFIG,
} from "widgets/DatePickerWidget";
import DatePickerWidget2, {
  CONFIG as DATE_PICKER_WIDGET_2_CONFIG,
} from "widgets/DatePickerWidget2";
import DividerWidget, {
  CONFIG as DIVIDER_WIDGET_CONFIG,
} from "widgets/DividerWidget";
import MultiSelectWidgetV2, {
  CONFIG as MULTI_SELECT_WIDGET_V2_CONFIG,
} from "widgets/MultiSelectWidgetV2";
import DocumentViewerWidget, {
  CONFIG as DOCUMENT_VIEWER_WIDGET_CONFIG,
} from "widgets/DocumentViewerWidget";
import DropdownWidget, {
  CONFIG as DROPDOWN_WIDGET_CONFIG,
} from "widgets/DropdownWidget";
import FilePickerWidget, {
  CONFIG as FILEPICKER_WIDGET_CONFIG,
} from "widgets/FilepickerWidget";
import FilePickerWidgetV2, {
  CONFIG as FILEPICKER_WIDGET_V2_CONFIG,
} from "widgets/FilePickerWidgetV2";
import FormButtonWidget, {
  CONFIG as FORM_BUTTON_WIDGET_CONFIG,
} from "widgets/FormButtonWidget";
import FormWidget, { CONFIG as FORM_WIDGET_CONFIG } from "widgets/FormWidget";
import IconButtonWidget, {
  CONFIG as ICON_BUTTON_WIDGET_CONFIG,
} from "widgets/IconButtonWidget";
import IconWidget, { CONFIG as ICON_WIDGET_CONFIG } from "widgets/IconWidget";
import IframeWidget, {
  CONFIG as IFRAME_WIDGET_CONFIG,
} from "widgets/IframeWidget";
import ImageWidget, {
  CONFIG as IMAGE_WIDGET_CONFIG,
} from "widgets/ImageWidget";
import InputWidget, {
  CONFIG as INPUT_WIDGET_CONFIG,
} from "widgets/InputWidget";
import InputWidgetV2, {
  CONFIG as INPUT_WIDGET_V2_CONFIG,
} from "widgets/InputWidgetV2";
import ListWidget, { CONFIG as LIST_WIDGET_CONFIG } from "widgets/ListWidget";
import MapChartWidget, {
  CONFIG as MAP_CHART_WIDGET_CONFIG,
} from "widgets/MapChartWidget";
import MapWidget, { CONFIG as MAP_WIDGET_CONFIG } from "widgets/MapWidget";
import MenuButtonWidget, {
  CONFIG as MENU_BUTTON_WIDGET_CONFIG,
} from "widgets/MenuButtonWidget";
import ModalWidget, {
  CONFIG as MODAL_WIDGET_CONFIG,
} from "widgets/ModalWidget";
import MultiSelectTreeWidget, {
  CONFIG as MULTI_SELECT_TREE_WIDGET_CONFIG,
} from "widgets/MultiSelectTreeWidget";
import MultiSelectWidget, {
  CONFIG as MULTI_SELECT_WIDGET_CONFIG,
} from "widgets/MultiSelectWidget";
import PhoneInputWidget, {
  CONFIG as PHONE_INPUT_WIDGET_V2_CONFIG,
} from "widgets/PhoneInputWidget";
import ProgressBarWidget, {
  CONFIG as PROGRESSBAR_WIDGET_CONFIG,
} from "widgets/ProgressBarWidget";
import RadioGroupWidget, {
  CONFIG as RADIO_GROUP_WIDGET_CONFIG,
} from "widgets/RadioGroupWidget";
import RateWidget, { CONFIG as RATE_WIDGET_CONFIG } from "widgets/RateWidget";
import RichTextEditorWidget, {
  CONFIG as RICH_TEXT_EDITOR_WIDGET_CONFIG,
} from "widgets/RichTextEditorWidget";
import SingleSelectTreeWidget, {
  CONFIG as SINGLE_SELECT_TREE_WIDGET_CONFIG,
} from "widgets/SingleSelectTreeWidget";
import SkeletonWidget, {
  CONFIG as SKELETON_WIDGET_CONFIG,
} from "widgets/SkeletonWidget";
import StatboxWidget, {
  CONFIG as STATBOX_WIDGET_CONFIG,
} from "widgets/StatboxWidget";
import SwitchGroupWidget, {
  CONFIG as SWITCH_GROUP_WIDGET_CONFIG,
} from "widgets/SwitchGroupWidget";
import SwitchWidget, {
  CONFIG as SWITCH_WIDGET_CONFIG,
} from "widgets/SwitchWidget";
import TableWidget, {
  CONFIG as TABLE_WIDGET_CONFIG,
} from "widgets/TableWidget";
import TabsMigratorWidget, {
  CONFIG as TABS_MIGRATOR_WIDGET_CONFIG,
} from "widgets/TabsMigrator";
import TabsWidget, { CONFIG as TABS_WIDGET_CONFIG } from "widgets/TabsWidget";
import TextWidget, { CONFIG as TEXT_WIDGET_CONFIG } from "widgets/TextWidget";
import VideoWidget, {
  CONFIG as VIDEO_WIDGET_CONFIG,
} from "widgets/VideoWidget";
import { registerWidget, WidgetConfiguration } from "./WidgetRegisterHelpers";

export const ALL_WIDGETS_AND_CONFIG = [
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
  [SelectWidget, SELECT_WIDGET_CONFIG],
  [MultiSelectWidgetV2, MULTI_SELECT_WIDGET_V2_CONFIG],
  [CircularProgressWidget, CIRCULAR_PROGRESS_WIDGET_CONFIG],
  [InputWidgetV2, INPUT_WIDGET_V2_CONFIG],
  [PhoneInputWidget, PHONE_INPUT_WIDGET_V2_CONFIG],
  [CurrencyInputWidget, CURRENCY_INPUT_WIDGET_V2_CONFIG],
  /*
   * If a newly added widget works well inside the list widget,
   * please add widget type in the List widget's allowed widget
   * list, to make the new widget be droppable inside List widget.
   */
];

export const registerWidgets = () => {
  const start = performance.now();
  for (const widget of ALL_WIDGETS_AND_CONFIG) {
    registerWidget(widget[0], widget[1] as WidgetConfiguration);
  }

  log.debug("Widget registration took: ", performance.now() - start, "ms");
};
