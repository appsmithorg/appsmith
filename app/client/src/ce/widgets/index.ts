import AudioRecorderWidget from "../../widgets/AudioRecorderWidget";
import AudioWidget from "../../widgets/AudioWidget";
import ButtonGroupWidget from "../../widgets/ButtonGroupWidget";
import ButtonWidget from "../../widgets/ButtonWidget";
import SelectWidget from "../../widgets/SelectWidget";
import CameraWidget from "../../widgets/CameraWidget";
import CanvasWidget from "../../widgets/CanvasWidget";
import ChartWidget from "../../widgets/ChartWidget";
import CheckboxGroupWidget from "../../widgets/CheckboxGroupWidget";
import CheckboxWidget from "../../widgets/CheckboxWidget";
import CircularProgressWidget from "../../widgets/CircularProgressWidget";
import ContainerWidget from "../../widgets/ContainerWidget";
import CurrencyInputWidget from "../../widgets/CurrencyInputWidget";
import DatePickerWidget from "../../widgets/DatePickerWidget";
import DatePickerWidget2 from "../../widgets/DatePickerWidget2";
import DividerWidget from "../../widgets/DividerWidget";
import MultiSelectWidgetV2 from "../../widgets/MultiSelectWidgetV2";
import DocumentViewerWidget from "../../widgets/DocumentViewerWidget";
import DropdownWidget from "../../widgets/DropdownWidget";
import FilePickerWidget from "../../widgets/FilepickerWidget";
import FilePickerWidgetV2 from "../../widgets/FilePickerWidgetV2";
import FormButtonWidget from "../../widgets/FormButtonWidget";
import FormWidget from "../../widgets/FormWidget";
import IconButtonWidget from "../../widgets/IconButtonWidget";
import IconWidget from "../../widgets/IconWidget";
import IframeWidget from "../../widgets/IframeWidget";
import ImageWidget from "../../widgets/ImageWidget";
import InputWidget from "../../widgets/InputWidget";
import InputWidgetV2 from "../../widgets/InputWidgetV2";
import ListWidget from "../../widgets/ListWidget";
import MapChartWidget from "../../widgets/MapChartWidget";
import MapWidget from "../../widgets/MapWidget";
import MenuButtonWidget from "../../widgets/MenuButtonWidget";
import ModalWidget from "../../widgets/ModalWidget";
import MultiSelectTreeWidget from "../../widgets/MultiSelectTreeWidget";
import MultiSelectWidget from "../../widgets/MultiSelectWidget";
import PhoneInputWidget from "../../widgets/PhoneInputWidget";
import ProgressBarWidget from "../../widgets/ProgressBarWidget";
import RadioGroupWidget from "../../widgets/RadioGroupWidget";
import RateWidget from "../../widgets/RateWidget";
import RichTextEditorWidget from "../../widgets/RichTextEditorWidget";
import SingleSelectTreeWidget from "../../widgets/SingleSelectTreeWidget";
import SkeletonWidget from "../../widgets/SkeletonWidget";
import StatboxWidget from "../../widgets/StatboxWidget";
import JSONFormWidget from "../../widgets/JSONFormWidget";
import SwitchGroupWidget from "../../widgets/SwitchGroupWidget";
import SwitchWidget from "../../widgets/SwitchWidget";
import TableWidget from "../../widgets/TableWidget";
import TabsMigratorWidget from "../../widgets/TabsMigrator";
import TabsWidget from "../../widgets/TabsWidget";
import TextWidget from "../../widgets/TextWidget";
import VideoWidget from "../../widgets/VideoWidget";
import ProgressWidget from "../../widgets/ProgressWidget";
import TableWidgetV2 from "../../widgets/TableWidgetV2";
import NumberSliderWidget from "../../widgets/NumberSliderWidget";
import RangeSliderWidget from "../../widgets/RangeSliderWidget";
import CategorySliderWidget from "../../widgets/CategorySliderWidget";
import CodeScannerWidget from "../../widgets/CodeScannerWidget";
import ListWidgetV2 from "../../widgets/ListWidgetV2";
import { WDSButtonWidget } from "modules/ui-builder/ui/wds/WDSButtonWidget";
import { WDSInputWidget } from "modules/ui-builder/ui/wds/WDSInputWidget";
import { WDSCheckboxWidget } from "modules/ui-builder/ui/wds/WDSCheckboxWidget";
import { WDSIconButtonWidget } from "modules/ui-builder/ui/wds/WDSIconButtonWidget";
import type BaseWidget from "../../widgets/BaseWidget";
import ExternalWidget from "../../widgets/ExternalWidget";
import { WDSTableWidget } from "modules/ui-builder/ui/wds/WDSTableWidget";
import { WDSCurrencyInputWidget } from "modules/ui-builder/ui/wds/WDSCurrencyInputWidget";
import { WDSToolbarButtonsWidget } from "modules/ui-builder/ui/wds/WDSToolbarButtonsWidget";
import { WDSPhoneInputWidget } from "modules/ui-builder/ui/wds/WDSPhoneInputWidget";
import { WDSCheckboxGroupWidget } from "modules/ui-builder/ui/wds/WDSCheckboxGroupWidget";
import { WDSComboBoxWidget } from "modules/ui-builder/ui/wds/WDSComboBoxWidget";
import { WDSSwitchWidget } from "modules/ui-builder/ui/wds/WDSSwitchWidget";
import { WDSSwitchGroupWidget } from "modules/ui-builder/ui/wds/WDSSwitchGroupWidget";
import { WDSRadioGroupWidget } from "modules/ui-builder/ui/wds/WDSRadioGroupWidget";
import { WDSMenuButtonWidget } from "modules/ui-builder/ui/wds/WDSMenuButtonWidget";
import CustomWidget from "../../widgets/CustomWidget";
import { WDSSectionWidget } from "modules/ui-builder/ui/wds/WDSSectionWidget";
import { WDSZoneWidget } from "modules/ui-builder/ui/wds/WDSZoneWidget";
import { WDSHeadingWidget } from "modules/ui-builder/ui/wds/WDSHeadingWidget";
import { WDSParagraphWidget } from "modules/ui-builder/ui/wds/WDSParagraphWidget";
import { WDSModalWidget } from "modules/ui-builder/ui/wds/WDSModalWidget";
import { WDSStatsWidget } from "modules/ui-builder/ui/wds/WDSStatsWidget";
import { WDSKeyValueWidget } from "modules/ui-builder/ui/wds/WDSKeyValueWidget";
import { WDSInlineButtonsWidget } from "modules/ui-builder/ui/wds/WDSInlineButtonsWidget";
import { WDSEmailInputWidget } from "modules/ui-builder/ui/wds/WDSEmailInputWidget";
import { WDSPasswordInputWidget } from "modules/ui-builder/ui/wds/WDSPasswordInputWidget";
import { WDSNumberInputWidget } from "modules/ui-builder/ui/wds/WDSNumberInputWidget";
import { WDSMultilineInputWidget } from "modules/ui-builder/ui/wds/WDSMultilineInputWidget";
import { WDSSelectWidget } from "modules/ui-builder/ui/wds/WDSSelectWidget";

const LegacyWidgets = [
  CanvasWidget,
  SkeletonWidget,
  ContainerWidget,
  TextWidget,
  TableWidget,
  CheckboxWidget,
  RadioGroupWidget,
  ButtonWidget,
  ImageWidget,
  VideoWidget,
  TabsWidget,
  ModalWidget,
  ChartWidget,
  MapWidget,
  RichTextEditorWidget,
  DatePickerWidget2,
  SwitchWidget,
  FormWidget,
  RateWidget,
  IframeWidget,
  TabsMigratorWidget,
  DividerWidget,
  MenuButtonWidget,
  IconButtonWidget,
  CheckboxGroupWidget,
  FilePickerWidgetV2,
  StatboxWidget,
  AudioRecorderWidget,
  DocumentViewerWidget,
  ButtonGroupWidget,
  MultiSelectTreeWidget,
  SingleSelectTreeWidget,
  SwitchGroupWidget,
  AudioWidget,
  ProgressBarWidget,
  CameraWidget,
  MapChartWidget,
  SelectWidget,
  MultiSelectWidgetV2,
  InputWidgetV2,
  PhoneInputWidget,
  CurrencyInputWidget,
  JSONFormWidget,
  TableWidgetV2,
  NumberSliderWidget,
  RangeSliderWidget,
  CategorySliderWidget,
  CodeScannerWidget,
  ListWidgetV2,
  ExternalWidget,
];

const DeprecatedWidgets = [
  //Deprecated Widgets
  InputWidget,
  DropdownWidget,
  DatePickerWidget,
  IconWidget,
  FilePickerWidget,
  MultiSelectWidget,
  FormButtonWidget,
  ProgressWidget,
  CircularProgressWidget,
  ListWidget,
];

const WDSWidgets = [
  // WDS Widgets
  WDSButtonWidget,
  WDSInputWidget,
  WDSCheckboxWidget,
  WDSIconButtonWidget,
  WDSTableWidget,
  WDSCurrencyInputWidget,
  WDSToolbarButtonsWidget,
  WDSPhoneInputWidget,
  WDSCheckboxGroupWidget,
  WDSComboBoxWidget,
  WDSSwitchWidget,
  WDSSwitchGroupWidget,
  WDSRadioGroupWidget,
  WDSMenuButtonWidget,
  CustomWidget,
  WDSSectionWidget,
  WDSZoneWidget,
  WDSParagraphWidget,
  WDSHeadingWidget,
  WDSModalWidget,
  WDSStatsWidget,
  WDSKeyValueWidget,
  WDSInlineButtonsWidget,
  WDSEmailInputWidget,
  WDSPasswordInputWidget,
  WDSNumberInputWidget,
  WDSMultilineInputWidget,
  WDSSelectWidget,
];

const Widgets = [
  ...WDSWidgets,
  ...DeprecatedWidgets,
  ...LegacyWidgets,
] as (typeof BaseWidget)[];

export default Widgets;
