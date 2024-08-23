import AudioRecorderWidget from "./AudioRecorderWidget";
import AudioWidget from "./AudioWidget";
import type BaseWidget from "./BaseWidget";
import ButtonGroupWidget from "./ButtonGroupWidget";
import ButtonWidget from "./ButtonWidget";
import CameraWidget from "./CameraWidget";
import CanvasWidget from "./CanvasWidget";
import CategorySliderWidget from "./CategorySliderWidget";
import ChartWidget from "./ChartWidget";
import CheckboxGroupWidget from "./CheckboxGroupWidget";
import CheckboxWidget from "./CheckboxWidget";
import CircularProgressWidget from "./CircularProgressWidget";
import CodeScannerWidget from "./CodeScannerWidget";
import ContainerWidget from "./ContainerWidget";
import CurrencyInputWidget from "./CurrencyInputWidget";
import CustomWidget from "./CustomWidget";
import DatePickerWidget from "./DatePickerWidget";
import DatePickerWidget2 from "./DatePickerWidget2";
import DividerWidget from "./DividerWidget";
import DocumentViewerWidget from "./DocumentViewerWidget";
import DropdownWidget from "./DropdownWidget";
import ExternalWidget from "./ExternalWidget";
import FilePickerWidgetV2 from "./FilePickerWidgetV2";
import FilePickerWidget from "./FilepickerWidget";
import FormButtonWidget from "./FormButtonWidget";
import FormWidget from "./FormWidget";
import IconButtonWidget from "./IconButtonWidget";
import IconWidget from "./IconWidget";
import IframeWidget from "./IframeWidget";
import ImageWidget from "./ImageWidget";
import InputWidget from "./InputWidget";
import InputWidgetV2 from "./InputWidgetV2";
import JSONFormWidget from "./JSONFormWidget";
import ListWidget from "./ListWidget";
import ListWidgetV2 from "./ListWidgetV2";
import MapChartWidget from "./MapChartWidget";
import MapWidget from "./MapWidget";
import MenuButtonWidget from "./MenuButtonWidget";
import ModalWidget from "./ModalWidget";
import MultiSelectTreeWidget from "./MultiSelectTreeWidget";
import MultiSelectWidget from "./MultiSelectWidget";
import MultiSelectWidgetV2 from "./MultiSelectWidgetV2";
import NumberSliderWidget from "./NumberSliderWidget";
import PhoneInputWidget from "./PhoneInputWidget";
import ProgressBarWidget from "./ProgressBarWidget";
import ProgressWidget from "./ProgressWidget";
import RadioGroupWidget from "./RadioGroupWidget";
import RangeSliderWidget from "./RangeSliderWidget";
import RateWidget from "./RateWidget";
import RichTextEditorWidget from "./RichTextEditorWidget";
import SelectWidget from "./SelectWidget";
import SingleSelectTreeWidget from "./SingleSelectTreeWidget";
import SkeletonWidget from "./SkeletonWidget";
import StatboxWidget from "./StatboxWidget";
import SwitchGroupWidget from "./SwitchGroupWidget";
import SwitchWidget from "./SwitchWidget";
import TableWidget from "./TableWidget";
import TableWidgetV2 from "./TableWidgetV2";
import TabsMigratorWidget from "./TabsMigrator";
import TabsWidget from "./TabsWidget";
import TextWidget from "./TextWidget";
import VideoWidget from "./VideoWidget";
import { SectionWidget } from "./anvil/SectionWidget";
import { ZoneWidget } from "./anvil/ZoneWidget";
import { WDSButtonWidget } from "./wds/WDSButtonWidget";
import { WDSCheckboxGroupWidget } from "./wds/WDSCheckboxGroupWidget";
import { WDSCheckboxWidget } from "./wds/WDSCheckboxWidget";
import { WDSCurrencyInputWidget } from "./wds/WDSCurrencyInputWidget";
import { WDSToolbarButtonsWidget } from "./wds/WDSToolbarButtonsWidget";
import { WDSPhoneInputWidget } from "./wds/WDSPhoneInputWidget";
import { WDSCheckboxGroupWidget } from "./wds/WDSCheckboxGroupWidget";
import { WDSSwitchWidget } from "./wds/WDSSwitchWidget";
import { WDSSwitchGroupWidget } from "./wds/WDSSwitchGroupWidget";
import { WDSRadioGroupWidget } from "./wds/WDSRadioGroupWidget";
import { WDSMenuButtonWidget } from "./wds/WDSMenuButtonWidget";
import CustomWidget from "./CustomWidget";
import { WDSSectionWidget } from "./wds/WDSSectionWidget";
import { WDSZoneWidget } from "./wds/WDSZoneWidget";
import { WDSHeadingWidget } from "./wds/WDSHeadingWidget";
import { WDSIconButtonWidget } from "./wds/WDSIconButtonWidget";
import { WDSInlineButtonsWidget } from "./wds/WDSInlineButtonsWidget";
import { WDSInputWidget } from "./wds/WDSInputWidget";
import { WDSKeyValueWidget } from "./wds/WDSKeyValueWidget";
import { WDSMenuButtonWidget } from "./wds/WDSMenuButtonWidget";
import { WDSModalWidget } from "./wds/WDSModalWidget";
import { WDSParagraphWidget } from "./wds/WDSParagraphWidget";
import { WDSPhoneInputWidget } from "./wds/WDSPhoneInputWidget";
import { WDSRadioGroupWidget } from "./wds/WDSRadioGroupWidget";
import { WDSStatsWidget } from "./wds/WDSStatsWidget";
import { WDSSwitchGroupWidget } from "./wds/WDSSwitchGroupWidget";
import { WDSSwitchWidget } from "./wds/WDSSwitchWidget";
import { WDSTableWidget } from "./wds/WDSTableWidget";
import { WDSToolbarButtonsWidget } from "./wds/WDSToolbarButtonsWidget";

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
];

const Widgets = [
  ...WDSWidgets,
  ...DeprecatedWidgets,
  ...LegacyWidgets,
] as (typeof BaseWidget)[];

export default Widgets;
