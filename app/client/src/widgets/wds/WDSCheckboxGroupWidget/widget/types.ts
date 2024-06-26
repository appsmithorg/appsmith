import type { ToggleGroupProps } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";

export interface OptionProps {
  label?: string;
  value: string;
}

export interface CheckboxGroupWidgetProps extends WidgetProps {
  defaultSelectedValues?: OptionProps["value"][];
  isDisabled: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  isVisible: boolean;
  labelPosition: "left" | "right";
  labelText?: string;
  onCheckChange?: string;
  options: OptionProps[];
  orientation: "vertical" | "horizontal";
}

export interface CheckboxGroupComponentProps extends CheckboxGroupWidgetProps {
  validationStatus?: "valid" | "invalid";
  errorMessage?: string;
  onChange: ToggleGroupProps["onChange"];
}
