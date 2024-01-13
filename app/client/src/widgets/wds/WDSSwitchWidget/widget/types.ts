import type { WidgetProps } from "widgets/BaseWidget";

export interface SwitchWidgetProps extends WidgetProps {
  label: string;
  defaultSwitchState: boolean;
  isSwitchedOn?: boolean;
  isDisabled?: boolean;
  onChange?: string;
  isRequired?: boolean;
  labelPosition?: "left" | "right";
}
