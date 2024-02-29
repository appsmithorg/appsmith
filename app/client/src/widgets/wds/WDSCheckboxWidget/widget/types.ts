import type { WidgetProps } from "widgets/types";

export interface CheckboxWidgetProps extends WidgetProps {
  label: string;
  defaultCheckedState: boolean;
  isChecked?: boolean;
  isDisabled?: boolean;
  onCheckChange?: string;
  isRequired?: boolean;
  labelPosition?: "left" | "right";
}
