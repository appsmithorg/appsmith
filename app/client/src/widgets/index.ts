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
import { WDSButtonWidget } from "modules/ui-builder/ui/wds/WDSButtonWidget";
import { WDSInputWidget } from "modules/ui-builder/ui/wds/WDSInputWidget";
import { WDSCheckboxWidget } from "modules/ui-builder/ui/wds/WDSCheckboxWidget";
import { WDSIconButtonWidget } from "modules/ui-builder/ui/wds/WDSIconButtonWidget";
import type BaseWidget from "./BaseWidget";
import ExternalWidget from "./ExternalWidget";
import { WDSCurrencyInputWidget } from "modules/ui-builder/ui/wds/WDSCurrencyInputWidget";
import { WDSToolbarButtonsWidget } from "modules/ui-builder/ui/wds/WDSToolbarButtonsWidget";
import { WDSPhoneInputWidget } from "modules/ui-builder/ui/wds/WDSPhoneInputWidget";
import { WDSCheckboxGroupWidget } from "modules/ui-builder/ui/wds/WDSCheckboxGroupWidget";
import { WDSComboBoxWidget } from "modules/ui-builder/ui/wds/WDSComboBoxWidget";
import { WDSSwitchWidget } from "modules/ui-builder/ui/wds/WDSSwitchWidget";
import { WDSSwitchGroupWidget } from "modules/ui-builder/ui/wds/WDSSwitchGroupWidget";
import { WDSRadioGroupWidget } from "modules/ui-builder/ui/wds/WDSRadioGroupWidget";
import { WDSMenuButtonWidget } from "modules/ui-builder/ui/wds/WDSMenuButtonWidget";
import CustomWidget from "./CustomWidget";
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
import { WDSCustomWidget } from "modules/ui-builder/ui/wds/WDSCustomWidget";
import { EEWDSWidgets } from "ee/modules/ui-builder/ui/wds";
import { WDSDatePickerWidget } from "modules/ui-builder/ui/wds/WDSDatePickerWidget";

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
  WDSButtonWidget,
  WDSInputWidget,
  WDSCheckboxWidget,
  WDSIconButtonWidget,

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
];

const Widgets = [
  ...WDSWidgets,
  ...DeprecatedWidgets,
  ...LegacyWidgets,
  ...EEWDSWidgets,
] as (typeof BaseWidget)[];

export default Widgets;
