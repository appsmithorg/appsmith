import { registerWidget } from "./WidgetRegisterHelpers";
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

import log from "loglevel";
import SingleSelectTreeWidget, {
  CONFIG as SINGLE_SELECT_TREE_WIDGET_CONFIG,
} from "widgets/SingleSelectTreeWidget";
import MultiSelectTreeWidget, {
  CONFIG as MULTI_SELECT_TREE_WIDGET_CONFIG,
} from "widgets/MultiSelectTreeWidget";

export const registerWidgets = () => {
  const start = performance.now();
  registerWidget(CanvasWidget, CANVAS_WIDGET_CONFIG);
  registerWidget(SkeletonWidget, SKELETON_WIDGET_CONFIG);
  registerWidget(ContainerWidget, CONTAINER_WIDGET_CONFIG);
  registerWidget(TextWidget, TEXT_WIDGET_CONFIG);
  registerWidget(TableWidget, TABLE_WIDGET_CONFIG);
  registerWidget(CheckboxWidget, CHECKBOX_WIDGET_CONFIG);
  registerWidget(RadioGroupWidget, RADIO_GROUP_WIDGET_CONFIG);
  registerWidget(ButtonWidget, BUTTON_WIDGET_CONFIG);
  registerWidget(DropdownWidget, DROPDOWN_WIDGET_CONFIG);
  registerWidget(ImageWidget, IMAGE_WIDGET_CONFIG);
  registerWidget(VideoWidget, VIDEO_WIDGET_CONFIG);
  registerWidget(TabsWidget, TABS_WIDGET_CONFIG);
  registerWidget(InputWidget, INPUT_WIDGET_CONFIG);
  registerWidget(ModalWidget, MODAL_WIDGET_CONFIG);
  registerWidget(ChartWidget, CHART_WIDGET_CONFIG);
  registerWidget(MapWidget, MAP_WIDGET_CONFIG);
  registerWidget(FilePickerWidget, FILEPICKER_WIDGET_CONFIG);
  registerWidget(RichTextEditorWidget, RICH_TEXT_EDITOR_WIDGET_CONFIG);
  registerWidget(DatePickerWidget, DATE_PICKER_WIDGET_CONFIG);
  registerWidget(DatePickerWidget2, DATE_PICKER_WIDGET_2_CONFIG);
  registerWidget(SwitchWidget, SWITCH_WIDGET_CONFIG);
  registerWidget(FormWidget, FORM_WIDGET_CONFIG);
  registerWidget(FormButtonWidget, FORM_BUTTON_WIDGET_CONFIG);
  registerWidget(IconWidget, ICON_WIDGET_CONFIG);
  registerWidget(ListWidget, LIST_WIDGET_CONFIG);
  registerWidget(RateWidget, RATE_WIDGET_CONFIG);
  registerWidget(IframeWidget, IFRAME_WIDGET_CONFIG);
  registerWidget(TabsMigratorWidget, TABS_MIGRATOR_WIDGET_CONFIG);
  registerWidget(DividerWidget, DIVIDER_WIDGET_CONFIG);
  registerWidget(MenuButtonWidget, MENU_BUTTON_WIDGET_CONFIG);
  registerWidget(MultiSelectWidget, MULTI_SELECT_WIDGET_CONFIG);
  registerWidget(IconButtonWidget, ICON_BUTTON_WIDGET_CONFIG);
  registerWidget(CheckboxGroupWidget, CHECKBOX_GROUP_WIDGET_CONFIG);
  registerWidget(FilePickerWidgetV2, FILEPICKER_WIDGET_V2_CONFIG);
  registerWidget(StatboxWidget, STATBOX_WIDGET_CONFIG);
  registerWidget(AudioRecorderWidget, AUDIO_RECORDER_WIDGET_CONFIG);
  registerWidget(MultiSelectTreeWidget, MULTI_SELECT_TREE_WIDGET_CONFIG);
  registerWidget(SingleSelectTreeWidget, SINGLE_SELECT_TREE_WIDGET_CONFIG);
  registerWidget(AudioWidget, AUDIO_WIDGET_CONFIG);

  log.debug("Widget registration took: ", performance.now() - start, "ms");
};
