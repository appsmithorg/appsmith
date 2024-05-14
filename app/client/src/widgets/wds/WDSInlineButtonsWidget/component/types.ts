import type { ButtonGroupProps, ButtonProps } from "@design-system/widgets";
import type { ButtonsList } from "../widget/types";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

export interface InlineButtonsComponentProps extends ButtonGroupProps<object> {
  buttonsList: ButtonsList;
  onButtonClick: (
    onClick?: string,
    callback?: (result: ExecutionResult) => void,
  ) => void;
}

export interface InlineButtonsItemComponentProps extends ButtonProps {
  label?: string;
  isVisible?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  widgetId: string;
  id: string;
  index: number;
  onClick?: string;
  itemType: "SEPARATOR" | "BUTTON";
}
