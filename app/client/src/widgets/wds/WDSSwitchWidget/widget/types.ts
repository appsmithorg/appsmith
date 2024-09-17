import type { WidgetProps } from "widgets/BaseWidget";
import type { POSITION } from "@appsmith/wds";

export interface SwitchWidgetProps extends WidgetProps {
  label: string;
  defaultSwitchState: boolean;
  isSwitchedOn?: boolean;
  isDisabled?: boolean;
  onChange?: string;
  isRequired?: boolean;
  labelPosition?: keyof typeof POSITION;
}
