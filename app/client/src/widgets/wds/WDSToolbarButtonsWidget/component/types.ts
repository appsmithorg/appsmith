import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";

import type { ToolbarButtonsItem, ToolbarButtonsProps } from "@appsmith/wds";

import type { ButtonsList } from "../widget/types";

export interface ToolbarButtonsComponentProps
  extends ToolbarButtonsProps<ToolbarButtonsItem> {
  buttonsList: ButtonsList;
  onButtonClick: (
    onClick?: string,
    callback?: (result: ExecutionResult) => void,
  ) => void;
}

export interface ToolbarButtonsItemComponentProps extends ToolbarButtonsItem {
  isVisible?: boolean;
  widgetId: string;
  index: number;
  onClick?: string;
  itemType: "SEPARATOR" | "BUTTON";
}
