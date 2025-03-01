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
import { WDSButtonWidget } from "widgets/wds/WDSButtonWidget";
import { WDSInputWidget } from "widgets/wds/WDSInputWidget";
import { WDSCheckboxWidget } from "widgets/wds/WDSCheckboxWidget";
import { WDSIconButtonWidget } from "widgets/wds/WDSIconButtonWidget";
import type BaseWidget from "./BaseWidget";
import ExternalWidget from "./ExternalWidget";
import { WDSTableWidget } from "widgets/wds/WDSTableWidget";
import { WDSCurrencyInputWidget } from "widgets/wds/WDSCurrencyInputWidget";
import { WDSToolbarButtonsWidget } from "widgets/wds/WDSToolbarButtonsWidget";
import { WDSPhoneInputWidget } from "widgets/wds/WDSPhoneInputWidget";
import { WDSCheckboxGroupWidget } from "widgets/wds/WDSCheckboxGroupWidget";
import { WDSComboBoxWidget } from "widgets/wds/WDSComboBoxWidget";
import { WDSSwitchWidget } from "widgets/wds/WDSSwitchWidget";
import { WDSSwitchGroupWidget } from "widgets/wds/WDSSwitchGroupWidget";
import { WDSRadioGroupWidget } from "widgets/wds/WDSRadioGroupWidget";
import { WDSMenuButtonWidget } from "widgets/wds/WDSMenuButtonWidget";
import CustomWidget from "./CustomWidget";
import { WDSSectionWidget } from "widgets/wds/WDSSectionWidget";
import { WDSZoneWidget } from "widgets/wds/WDSZoneWidget";
import { WDSHeadingWidget } from "widgets/wds/WDSHeadingWidget";
import { WDSParagraphWidget } from "widgets/wds/WDSParagraphWidget";
import { WDSModalWidget } from "widgets/wds/WDSModalWidget";
import { WDSStatsWidget } from "widgets/wds/WDSStatsWidget";
import { WDSKeyValueWidget } from "widgets/wds/WDSKeyValueWidget";
import { WDSInlineButtonsWidget } from "widgets/wds/WDSInlineButtonsWidget";
import { WDSEmailInputWidget } from "widgets/wds/WDSEmailInputWidget";
import { WDSPasswordInputWidget } from "widgets/wds/WDSPasswordInputWidget";
import { WDSNumberInputWidget } from "widgets/wds/WDSNumberInputWidget";
import { WDSMultilineInputWidget } from "widgets/wds/WDSMultilineInputWidget";
import { WDSSelectWidget } from "widgets/wds/WDSSelectWidget";
import { WDSCustomWidget } from "widgets/wds/WDSCustomWidget";
import { EEWDSWidgets } from "ee/widgets/wds";
import { WDSDatePickerWidget } from "widgets/wds/WDSDatePickerWidget";
import { WDSMultiSelectWidget } from "widgets/wds/WDSMultiSelectWidget";
import { EEWidgets } from "ee/widgets";
import MyDatePickerWidget from './MyDatePickerWidget';

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
  MyDatePickerWidget,
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
  WDSDatePickerWidget,
  WDSCustomWidget,
  WDSMultiSelectWidget,
];

const Widgets = [
  ...WDSWidgets,
  ...DeprecatedWidgets,
  ...LegacyWidgets,
  ...EEWDSWidgets,
  ...EEWidgets,
] as (typeof BaseWidget)[];

export default Widgets;
