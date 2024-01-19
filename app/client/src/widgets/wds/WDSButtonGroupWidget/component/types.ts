import type {
  ActionGroupProps,
  ButtonProps,
  IconProps,
} from "@design-system/widgets";
import type { ButtonsList } from "../widget/types";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

export interface ButtonGroupComponentProps {
  color?: ActionGroupProps<object>["color"];
  variant?: ActionGroupProps<object>["variant"];
  orientation: ActionGroupProps<object>["orientation"];
  buttonsList: ButtonsList;
  onButtonClick: (
    onClick?: string,
    callback?: (result: ExecutionResult) => void,
  ) => void;
  density?: ActionGroupProps<object>["density"];
}

export interface ButtonGroupItemComponentProps {
  label?: string;
  isVisible?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  widgetId: string;
  id: string;
  index: number;
  iconName?: IconProps["name"];
  iconAlign?: ButtonProps["iconPosition"];
  onClick?: string;
}
