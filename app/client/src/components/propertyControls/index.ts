import type { InputControlProps } from "components/propertyControls/InputTextControl";
import InputTextControl from "components/propertyControls/InputTextControl";
import type { DropDownControlProps } from "components/propertyControls/DropDownControl";
import DropDownControl from "components/propertyControls/DropDownControl";
import type { SwitchControlProps } from "components/propertyControls/SwitchControl";
import SwitchControl from "components/propertyControls/SwitchControl";
import OptionControl from "components/propertyControls/OptionControl";
import type { ControlProps } from "components/propertyControls/BaseControl";
import type BaseControl from "components/propertyControls/BaseControl";
import CodeEditorControl from "components/propertyControls/CodeEditorControl";
import type { DatePickerControlProps } from "components/propertyControls/DatePickerControl";
import DatePickerControl from "components/propertyControls/DatePickerControl";
import ChartDataControl from "components/propertyControls/ChartDataControl";
import LocationSearchControl from "components/propertyControls/LocationSearchControl";
import type { StepControlProps } from "components/propertyControls/StepControl";
import StepControl from "components/propertyControls/StepControl";
import TabControl from "components/propertyControls/TabControl";
import ActionSelectorControl from "components/propertyControls/ActionSelectorControl";
import ColumnActionSelectorControl from "components/propertyControls/ColumnActionSelectorControl";
import PrimaryColumnsControl from "components/propertyControls/PrimaryColumnsControl";
import type { PrimaryColumnDropdownControlProps } from "components/propertyControls/PrimaryColumnDropdownControl";
import PrimaryColumnDropdownControl from "components/propertyControls/PrimaryColumnDropdownControl";
import type { ColorPickerControlProps } from "components/propertyControls/ColorPickerControl";
import ColorPickerControl from "components/propertyControls/ColorPickerControl";
import type { PrimaryColumnColorPickerControlProps } from "components/propertyControls/PrimaryColumnColorPickerControl";
import PrimaryColumnColorPickerControl from "components/propertyControls/PrimaryColumnColorPickerControl";
import type { ComputeTablePropertyControlProps } from "components/propertyControls/ComputeTablePropertyControl";
import ComputeTablePropertyControl from "components/propertyControls/ComputeTablePropertyControl";
import type { IconTabControlProps } from "components/propertyControls/IconTabControl";
import IconTabControl from "components/propertyControls/IconTabControl";
import type { ButtonTabControlProps } from "components/propertyControls/ButtonTabControl";
import ButtonTabControl from "components/propertyControls/ButtonTabControl";
import type { MultiSwitchControlProps } from "components/propertyControls/MultiSwitchControl";
import MultiSwitchControl from "components/propertyControls/MultiSwitchControl";
import MenuItemsControl from "./MenuItemsControl";
import OpenConfigPanelControl from "./OpenConfigPanelControl";
import ButtonListControl from "./ButtonListControl";
import IconSelectControl from "./IconSelectControl";
import BoxShadowOptionsControl from "./BoxShadowOptionsControl";
import BorderRadiusOptionsControl from "./BorderRadiusOptionsControl";
import ButtonBorderRadiusOptionsControl from "./ButtonBorderRadiusControl";
import FieldConfigurationControl from "components/propertyControls/FieldConfigurationControl";
import JSONFormComputeControl from "./JSONFormComputeControl";
import ButtonControl from "./ButtonControl";
import LabelAlignmentOptionsControl from "./LabelAlignmentOptionsControl";
import type { NumericInputControlProps } from "./NumericInputControl";
import NumericInputControl from "./NumericInputControl";
import PrimaryColumnsControlV2 from "components/propertyControls/PrimaryColumnsControlV2";
import type { SelectDefaultValueControlProps } from "./SelectDefaultValueControl";
import SelectDefaultValueControl from "./SelectDefaultValueControl";
import type { ComputeTablePropertyControlPropsV2 } from "components/propertyControls/TableComputeValue";
import ComputeTablePropertyControlV2 from "components/propertyControls/TableComputeValue";
import type { PrimaryColumnColorPickerControlPropsV2 } from "components/propertyControls/PrimaryColumnColorPickerControlV2";
import PrimaryColumnColorPickerControlV2 from "components/propertyControls/PrimaryColumnColorPickerControlV2";
import type { TableInlineEditValidationControlProps } from "./TableInlineEditValidationControl";
import TableInlineEditValidationControl from "./TableInlineEditValidationControl";
import TableInlineEditValidPropertyControl from "./TableInlineEditValidPropertyControl";
import type { MenuButtonDynamicItemsControlProps } from "components/propertyControls/MenuButtonDynamicItemsControl";
import MenuButtonDynamicItemsControl from "components/propertyControls/MenuButtonDynamicItemsControl";
import type { ListComputeControlProps } from "./ListComputeControl";
import ListComputeControl from "./ListComputeControl";
import type { OneClickBindingControlProps } from "./OneClickBindingControl";
import OneClickBindingControl from "./OneClickBindingControl";
import type { WrappedCodeEditorControlProps } from "./WrappedCodeEditorControl";
import WrappedCodeEditorControl from "./WrappedCodeEditorControl";
import DynamicPropertiesControl from "./HTMLDocumentBuilderControl";
import CustomWidgetEditSourceButtonControl from "./CustomWidgetEditSourceButtonControl";
import CustomWidgetAddEventButtonControl from "./CustomWidgetAddEventButtonControl";
import type { ZoneStepperControlProps } from "./ZoneStepperControl";
import ZoneStepperControl from "./ZoneStepperControl";
import {
  SectionSplitterControl,
  type SectionSplitterControlProps,
} from "./SectionSplitterControl";
import type { IconSelectControlV2Props } from "./IconSelectControlV2";
import IconSelectControlV2 from "./IconSelectControlV2";
import PrimaryColumnsControlWDS from "./PrimaryColumnsControlWDS";
import ToolbarButtonListControl from "./ToolbarButtonListControl";

export const PropertyControls = {
  InputTextControl,
  DropDownControl,
  SwitchControl,
  OptionControl,
  CodeEditorControl,
  DatePickerControl,
  ActionSelectorControl,
  ColumnActionSelectorControl,
  MultiSwitchControl,
  ChartDataControl,
  LocationSearchControl,
  StepControl,
  TabControl,
  ColorPickerControl,
  PrimaryColumnsControl,
  PrimaryColumnsControlV2,
  PrimaryColumnDropdownControl,
  IconTabControl,
  ButtonTabControl,
  ComputeTablePropertyControl,
  ComputeTablePropertyControlV2,
  MenuItemsControl,
  MenuButtonDynamicItemsControl,
  OpenConfigPanelControl,
  ButtonListControl,
  IconSelectControl,
  BoxShadowOptionsControl,
  BorderRadiusOptionsControl,
  ButtonBorderRadiusOptionsControl,
  FieldConfigurationControl,
  JSONFormComputeControl,
  ButtonControl,
  LabelAlignmentOptionsControl,
  NumericInputControl,
  PrimaryColumnColorPickerControl,
  PrimaryColumnColorPickerControlV2,
  SelectDefaultValueControl,
  TableInlineEditValidationControl,
  TableInlineEditValidPropertyControl,
  ListComputeControl,
  OneClickBindingControl,
  WrappedCodeEditorControl,
  DynamicPropertiesControl,
  CustomWidgetEditSourceButtonControl,
  CustomWidgetAddEventButtonControl,
  ZoneStepperControl,
  SectionSplitterControl,
  IconSelectControlV2,
  PrimaryColumnsControlWDS,
  ToolbarButtonListControl,
};

export type PropertyControlPropsType =
  | ControlProps
  | InputControlProps
  | DropDownControlProps
  | SwitchControlProps
  | DatePickerControlProps
  | MultiSwitchControlProps
  | IconTabControlProps
  | ButtonTabControlProps
  | StepControlProps
  | ColorPickerControlProps
  | ComputeTablePropertyControlProps
  | PrimaryColumnDropdownControlProps
  | NumericInputControlProps
  | PrimaryColumnColorPickerControlProps
  | ComputeTablePropertyControlPropsV2
  | MenuButtonDynamicItemsControlProps
  | PrimaryColumnDropdownControlProps
  | PrimaryColumnColorPickerControlPropsV2
  | SelectDefaultValueControlProps
  | TableInlineEditValidationControlProps
  | ListComputeControlProps
  | OneClickBindingControlProps
  | WrappedCodeEditorControlProps
  | ZoneStepperControlProps
  | SectionSplitterControlProps
  | IconSelectControlV2Props;

export const getPropertyControlTypes = (): { [key: string]: string } => {
  const _types: { [key: string]: string } = {};

  Object.values(PropertyControls).forEach(
    (Control: typeof BaseControl & { getControlType: () => string }) => {
      const controlType = Control.getControlType();

      _types[controlType] = controlType;
    },
  );

  return _types;
};
