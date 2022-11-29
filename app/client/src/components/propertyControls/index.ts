import ActionSelectorControl from "components/propertyControls/ActionSelectorControl";
import BaseControl, {
  ControlProps,
} from "components/propertyControls/BaseControl";
import ButtonTabControl, {
  ButtonTabControlProps,
} from "components/propertyControls/ButtonTabControl";
import ChartDataControl from "components/propertyControls/ChartDataControl";
import CodeEditorControl from "components/propertyControls/CodeEditorControl";
import ColorPickerControl, {
  ColorPickerControlProps,
} from "components/propertyControls/ColorPickerControl";
import ColumnActionSelectorControl from "components/propertyControls/ColumnActionSelectorControl";
import ComputeTablePropertyControl, {
  ComputeTablePropertyControlProps,
} from "components/propertyControls/ComputeTablePropertyControl";
import DatePickerControl, {
  DatePickerControlProps,
} from "components/propertyControls/DatePickerControl";
import DropDownControl, {
  DropDownControlProps,
} from "components/propertyControls/DropDownControl";
import FieldConfigurationControl from "components/propertyControls/FieldConfigurationControl";
import IconTabControl, {
  IconTabControlProps,
} from "components/propertyControls/IconTabControl";
import InputTextControl, {
  InputControlProps,
} from "components/propertyControls/InputTextControl";
import LocationSearchControl from "components/propertyControls/LocationSearchControl";
import MultiSwitchControl, {
  MultiSwitchControlProps,
} from "components/propertyControls/MultiSwitchControl";
import OptionControl from "components/propertyControls/OptionControl";
import PrimaryColumnColorPickerControl, {
  PrimaryColumnColorPickerControlProps,
} from "components/propertyControls/PrimaryColumnColorPickerControl";
import PrimaryColumnColorPickerControlV2, {
  PrimaryColumnColorPickerControlPropsV2,
} from "components/propertyControls/PrimaryColumnColorPickerControlV2";
import PrimaryColumnDropdownControl, {
  PrimaryColumnDropdownControlProps,
} from "components/propertyControls/PrimaryColumnDropdownControl";
import PrimaryColumnsControl from "components/propertyControls/PrimaryColumnsControl";
import PrimaryColumnsControlV2 from "components/propertyControls/PrimaryColumnsControlV2";
import StepControl, {
  StepControlProps,
} from "components/propertyControls/StepControl";
import SwitchControl, {
  SwitchControlProps,
} from "components/propertyControls/SwitchControl";
import TabControl from "components/propertyControls/TabControl";
import ComputeTablePropertyControlV2, {
  ComputeTablePropertyControlPropsV2,
} from "components/propertyControls/TableComputeValue";
import BorderRadiusOptionsControl from "./BorderRadiusOptionsControl";
import BoxShadowOptionsControl from "./BoxShadowOptionsControl";
import ButtonBorderRadiusOptionsControl from "./ButtonBorderRadiusControl";
import ButtonControl from "./ButtonControl";
import ButtonListControl from "./ButtonListControl";
import ColumnSplitOptionsControl from "./ColumnSplitOptionsControl";
import IconSelectControl from "./IconSelectControl";
import JSONFormComputeControl from "./JSONFormComputeControl";
import LabelAlignmentOptionsControl from "./LabelAlignmentOptionsControl";
import MenuItemsControl from "./MenuItemsControl";
import NumericInputControl, {
  NumericInputControlProps,
} from "./NumericInputControl";
import SelectDefaultValueControl, {
  SelectDefaultValueControlProps,
} from "./SelectDefaultValueControl";
import TableInlineEditValidationControl, {
  TableInlineEditValidationControlProps,
} from "./TableInlineEditValidationControl";
import TableInlineEditValidPropertyControl from "./TableInlineEditValidPropertyControl";

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
  ButtonListControl,
  IconSelectControl,
  BoxShadowOptionsControl,
  BorderRadiusOptionsControl,
  ButtonBorderRadiusOptionsControl,
  ColumnSplitOptionsControl,
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
  | PrimaryColumnDropdownControlProps
  | PrimaryColumnColorPickerControlPropsV2
  | SelectDefaultValueControlProps
  | TableInlineEditValidationControlProps;

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
