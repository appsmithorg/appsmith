import InputTextControl, {
  InputControlProps,
} from "components/propertyControls/InputTextControl";
import DropDownControl, {
  DropDownControlProps,
} from "components/propertyControls/DropDownControl";
import SwitchControl, {
  SwitchControlProps,
} from "components/propertyControls/SwitchControl";
import OptionControl from "components/propertyControls/OptionControl";
import BaseControl, {
  ControlProps,
} from "components/propertyControls/BaseControl";
import CodeEditorControl from "components/propertyControls/CodeEditorControl";
import DatePickerControl, {
  DatePickerControlProps,
} from "components/propertyControls/DatePickerControl";
import ChartDataControl from "components/propertyControls/ChartDataControl";
import LocationSearchControl from "components/propertyControls/LocationSearchControl";
import StepControl, {
  StepControlProps,
} from "components/propertyControls/StepControl";
import TabControl from "components/propertyControls/TabControl";
import ActionSelectorControl from "components/propertyControls/ActionSelectorControl";
import ColumnActionSelectorControl from "components/propertyControls/ColumnActionSelectorControl";
import PrimaryColumnsControl from "components/propertyControls/PrimaryColumnsControl";
import PrimaryColumnDropdownControl, {
  PrimaryColumnDropdownControlProps,
} from "components/propertyControls/PrimaryColumnDropdownControl";
import ColorPickerControl, {
  ColorPickerControlProps,
} from "components/propertyControls/ColorPickerControl";
import PrimaryColumnColorPickerControl, {
  PrimaryColumnColorPickerControlProps,
} from "components/propertyControls/PrimaryColumnColorPickerControl";
import ComputeTablePropertyControl, {
  ComputeTablePropertyControlProps,
} from "components/propertyControls/ComputeTablePropertyControl";
import IconTabControl, {
  IconTabControlProps,
} from "components/propertyControls/IconTabControl";
import ButtonTabControl, {
  ButtonTabControlProps,
} from "components/propertyControls/ButtonTabControl";
import MultiSwitchControl, {
  MultiSwitchControlProps,
} from "components/propertyControls/MultiSwitchControl";
import MenuItemsControl from "./MenuItemsControl";
import ButtonListControl from "./ButtonListControl";
import IconSelectControl from "./IconSelectControl";
import BoxShadowOptionsControl from "./BoxShadowOptionsControl";
import BorderRadiusOptionsControl from "./BorderRadiusOptionsControl";
import ButtonBorderRadiusOptionsControl from "./ButtonBorderRadiusControl";
import FieldConfigurationControl from "components/propertyControls/FieldConfigurationControl";
import JSONFormComputeControl from "./JSONFormComputeControl";
import ButtonControl from "./ButtonControl";
import LabelAlignmentOptionsControl from "./LabelAlignmentOptionsControl";
import NumericInputControl, {
  NumericInputControlProps,
} from "./NumericInputControl";
import PrimaryColumnsControlV2 from "components/propertyControls/PrimaryColumnsControlV2";
import SelectDefaultValueControl, {
  SelectDefaultValueControlProps,
} from "./SelectDefaultValueControl";
import ComputeTablePropertyControlV2, {
  ComputeTablePropertyControlPropsV2,
} from "components/propertyControls/TableComputeValue";
import PrimaryColumnColorPickerControlV2, {
  PrimaryColumnColorPickerControlPropsV2,
} from "components/propertyControls/PrimaryColumnColorPickerControlV2";
import TableInlineEditValidationControlProperty, {
  TableInlineEditValidationControlProps,
} from "./TableInlineEditValidation";

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
  FieldConfigurationControl,
  JSONFormComputeControl,
  ButtonControl,
  LabelAlignmentOptionsControl,
  NumericInputControl,
  PrimaryColumnColorPickerControl,
  PrimaryColumnColorPickerControlV2,
  SelectDefaultValueControl,
  TableInlineEditValidationControlProperty,
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
