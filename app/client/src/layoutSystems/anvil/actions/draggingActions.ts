import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AnvilHighlightInfo } from "../utils/anvilTypes";

/**
 * Add new anvil widget to canvas.
 */
export const addNewAnvilWidgetAction = (
  newWidget: {
    width: number;
    height: number;
    widgetId: string;
    type: string;
  },
  highlight: AnvilHighlightInfo,
) => {
  return {
    type: ReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
    highlight,
    newWidget,
  };
};

/**
 * Move existing widgets.
 */
export const moveAnvilWidgets = (
  highlight: AnvilHighlightInfo,
  movedWidgets: string[],
) => {
  return {
    type: ReduxActionTypes.ANVIL_MOVE_WIDGET,
    highlight,
    movedWidgets,
  };
};
