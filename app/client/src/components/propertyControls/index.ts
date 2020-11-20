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
import MultiSelectControl, {
  MultiSelectControlProps,
} from "components/propertyControls/MultiSelectControl";
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
import MultiSwitchControl, {
  MultiSwitchControlProps,
} from "components/propertyControls/MultiSwitchControl";

export const PropertyControls = {
  InputTextControl,
  DropDownControl,
  SwitchControl,
  OptionControl,
  CodeEditorControl,
  MultiSelectControl,
  DatePickerControl,
  ActionSelectorControl,
  ColumnActionSelectorControl,
  MultiSwitchControl,
  ChartDataControl,
  LocationSearchControl,
  StepControl,
  TabControl,
};

export type PropertyControlPropsType =
  | ControlProps
  | InputControlProps
  | DropDownControlProps
  | SwitchControlProps
  | MultiSelectControlProps
  | DatePickerControlProps
  | MultiSwitchControlProps
  | StepControlProps;

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
