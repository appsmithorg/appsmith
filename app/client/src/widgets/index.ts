import AudioRecorderWidget from "./AudioRecorderWidget";
import AudioWidget from "./AudioWidget";
import ButtonGroupWidget from "./ButtonGroupWidget";
import ButtonWidget from "./ButtonWidget";
import SelectWidget from "./SelectWidget";
import CameraWidget from "./CameraWidget";
import CanvasWidget from "./CanvasWidget";
import ChartWidget from "./ChartWidget";
import CheckboxGroupWidget from "./CheckboxGroupWidget";
import CheckboxWidget from "./CheckboxWidget";
import CircularProgressWidget from "./CircularProgressWidget";
import ContainerWidget from "./ContainerWidget";
import CurrencyInputWidget from "./CurrencyInputWidget";
import DatePickerWidget from "./DatePickerWidget";
import DatePickerWidget2 from "./DatePickerWidget2";
import DividerWidget from "./DividerWidget";
import MultiSelectWidgetV2 from "./MultiSelectWidgetV2";
import DocumentViewerWidget from "./DocumentViewerWidget";
import DropdownWidget from "./DropdownWidget";
import FilePickerWidget from "./FilepickerWidget";
import FilePickerWidgetV2 from "./FilePickerWidgetV2";
import FormButtonWidget from "./FormButtonWidget";
import FormWidget from "./FormWidget";
import IconButtonWidget from "./IconButtonWidget";
import IconWidget from "./IconWidget";
import IframeWidget from "./IframeWidget";
import ImageWidget from "./ImageWidget";
import InputWidget from "./InputWidget";
import InputWidgetV2 from "./InputWidgetV2";
import ListWidget from "./ListWidget";
import MapChartWidget from "./MapChartWidget";
import MapWidget from "./MapWidget";
import MenuButtonWidget from "./MenuButtonWidget";
import ModalWidget from "./ModalWidget";
import MultiSelectTreeWidget from "./MultiSelectTreeWidget";
import MultiSelectWidget from "./MultiSelectWidget";
import PhoneInputWidget from "./PhoneInputWidget";
import ProgressBarWidget from "./ProgressBarWidget";
import RadioGroupWidget from "./RadioGroupWidget";
import RateWidget from "./RateWidget";
import RichTextEditorWidget from "./RichTextEditorWidget";
import SingleSelectTreeWidget from "./SingleSelectTreeWidget";
import SkeletonWidget from "./SkeletonWidget";
import StatboxWidget from "./StatboxWidget";
import JSONFormWidget from "./JSONFormWidget";
import SwitchGroupWidget from "./SwitchGroupWidget";
import SwitchWidget from "./SwitchWidget";
import TableWidget from "./TableWidget";
import TabsMigratorWidget from "./TabsMigrator";
import TabsWidget from "./TabsWidget";
import TextWidget from "./TextWidget";
import VideoWidget from "./VideoWidget";
import ProgressWidget from "./ProgressWidget";
import TableWidgetV2 from "./TableWidgetV2";
import NumberSliderWidget from "./NumberSliderWidget";
import RangeSliderWidget from "./RangeSliderWidget";
import CategorySliderWidget from "./CategorySliderWidget";
import CodeScannerWidget from "./CodeScannerWidget";
import ListWidgetV2 from "./ListWidgetV2";
import { WDSButtonWidget } from "./wds/WDSButtonWidget";
import { WDSInputWidget } from "./wds/WDSInputWidget";
import { WDSCheckboxWidget } from "./wds/WDSCheckboxWidget";
import { WDSIconButtonWidget } from "./wds/WDSIconButtonWidget";
import type BaseWidget from "./BaseWidget";
import ExternalWidget from "./ExternalWidget";
import { WDSTableWidget } from "./wds/WDSTableWidget";
import { WDSCurrencyInputWidget } from "./wds/WDSCurrencyInputWidget";
import { WDSToolbarButtonsWidget } from "./wds/WDSToolbarButtonsWidget";
import { WDSPhoneInputWidget } from "./wds/WDSPhoneInputWidget";
import { WDSCheckboxGroupWidget } from "./wds/WDSCheckboxGroupWidget";
import { WDSComboBoxWidget } from "./wds/WDSComboBoxWidget";
import { WDSSwitchWidget } from "./wds/WDSSwitchWidget";
import { WDSSwitchGroupWidget } from "./wds/WDSSwitchGroupWidget";
import { WDSRadioGroupWidget } from "./wds/WDSRadioGroupWidget";
import { WDSMenuButtonWidget } from "./wds/WDSMenuButtonWidget";
import CustomWidget from "./CustomWidget";
import { WDSSectionWidget } from "./wds/WDSSectionWidget";
import { WDSZoneWidget } from "./wds/WDSZoneWidget";
import { WDSHeadingWidget } from "./wds/WDSHeadingWidget";
import { WDSParagraphWidget } from "./wds/WDSParagraphWidget";
import { WDSModalWidget } from "./wds/WDSModalWidget";
import { WDSStatsWidget } from "./wds/WDSStatsWidget";
import { WDSKeyValueWidget } from "./wds/WDSKeyValueWidget";
import { WDSInlineButtonsWidget } from "./wds/WDSInlineButtonsWidget";
import { WDSEmailInputWidget } from "./wds/WDSEmailInputWidget";
import { WDSPasswordInputWidget } from "./wds/WDSPasswordInputWidget";
import { WDSNumberInputWidget } from "./wds/WDSNumberInputWidget";
import { WDSMultilineInputWidget } from "./wds/WDSMultilineInputWidget";
import { WDSSelectWidget } from "./wds/WDSSelectWidget";

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
