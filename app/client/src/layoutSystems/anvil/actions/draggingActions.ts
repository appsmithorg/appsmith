import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AnvilHighlightInfo } from "../utils/anvilTypes";

/**
 * Add new anvil widget to canvas.
 */
export const addNewAnvilWidgetAction = (
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
  highlight: AnvilHighlightInfo,
) => {
  return {
    type: ReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
    payload: {
      highlight,
      newWidget,
    },
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
    payload: {
      highlight,
      movedWidgets,
    },
  };
};
