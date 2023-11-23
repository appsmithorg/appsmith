import type { IconName } from "@blueprintjs/icons";
import type { ButtonGroupProps, ButtonProps } from "@design-system/widgets";
import type { ButtonsList } from "../widget/types";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

export interface ButtonGroupComponentProps {
  color?: ButtonGroupProps["color"];
  variant?: ButtonGroupProps["variant"];
  orientation: ButtonGroupProps["orientation"];
  buttonsList: ButtonsList;
  onButtonClick: (
    onClick: string,
    callback: (result: ExecutionResult) => void,
  ) => void;
}

export interface ButtonGroupItemComponentProps {
  label?: string;
  isVisible?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  widgetId: string;
  id: string;
  index: number;
  iconName?: IconName;
  iconAlign?: ButtonProps["iconPosition"];
  onClick?: string;
}
