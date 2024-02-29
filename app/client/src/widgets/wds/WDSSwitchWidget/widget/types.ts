import type { WidgetProps } from "widgets/types";

export interface SwitchWidgetProps extends WidgetProps {
  label: string;
  defaultSwitchState: boolean;
  isSwitchedOn?: boolean;
  isDisabled?: boolean;
  onChange?: string;
  isRequired?: boolean;
  labelPosition?: "left" | "right";
}
