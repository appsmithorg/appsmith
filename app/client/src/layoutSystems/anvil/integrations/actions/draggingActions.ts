import type { AnvilHighlightInfo } from "../../utils/anvilTypes";
import { AnvilActionTypes } from "../actionTypes";

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
    type: AnvilActionTypes.ANVIL_ADD_NEW_WIDGET,
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
    type: AnvilActionTypes.ANVIL_MOVE_WIDGET,
    payload: {
      highlight,
      movedWidgets,
    },
  };
};
