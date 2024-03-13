import type {
  ButtonGroupProps,
  ButtonProps,
  IconProps,
} from "@design-system/widgets";
import type { ButtonsList } from "../widget/types";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

export interface InlineButtonsComponentProps {
  color?: ButtonGroupProps<object>["color"];
  variant?: ButtonGroupProps<object>["variant"];
  orientation: ButtonGroupProps<object>["orientation"];
  buttonsList: ButtonsList;
  onButtonClick: (
    onClick?: string,
    callback?: (result: ExecutionResult) => void,
  ) => void;
  density?: ButtonGroupProps<object>["density"];
}

export interface InlineButtonsItemComponentProps {
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
  itemType: "SEPARATOR" | "BUTTON";
  buttonVariant?: ButtonProps["variant"];
  buttonColor?: ButtonProps["color"];
}
