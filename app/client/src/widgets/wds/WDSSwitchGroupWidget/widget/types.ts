import type { POSITION } from "@design-system/widgets";
import type { WidgetProps } from "widgets/BaseWidget";

export interface OptionProps {
  label?: string;
  value: string;
}

export interface SwitchGroupWidgetProps extends WidgetProps {
  defaultSelectedValues?: OptionProps["value"][];
  isDisabled: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  isVisible: boolean;
  labelPosition?: keyof typeof POSITION;
  labelText?: string;
  onSelectionChange?: string;
  options: OptionProps[];
  orientation: "vertical" | "horizontal";
}
