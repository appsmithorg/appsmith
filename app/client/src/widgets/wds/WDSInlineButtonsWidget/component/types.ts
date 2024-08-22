import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

import type { InlineButtonsItem, InlineButtonsProps } from "@appsmith/wds";

import type { ButtonsList } from "../widget/types";

export interface InlineButtonsComponentProps
  extends InlineButtonsProps<InlineButtonsItem> {
  buttonsList: ButtonsList;
  onButtonClick: (
    onClick?: string,
    callback?: (result: ExecutionResult) => void,
  ) => void;
}

export interface InlineButtonsItemComponentProps extends InlineButtonsItem {
  isVisible?: boolean;
  widgetId: string;
  index: number;
  onClick?: string;
  itemType: "SEPARATOR" | "BUTTON";
}
