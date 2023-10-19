import type { WidgetAddChild } from "actions/pageActions";
import type { AnvilHighlightInfo } from "../../utils/anvilTypes";
import { AnvilReduxActionTypes } from "./actionTypes";

/**
 * Add new anvil widget to canvas.
 */
export const addNewWidgetAction = (
  newWidget: WidgetAddChild,
  highlight: AnvilHighlightInfo,
) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
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
    type: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
    highlight,
    movedWidgets,
  };
};
