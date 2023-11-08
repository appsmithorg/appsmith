import type { WidgetProps } from "widgets/BaseWidget";
import type { AnvilHighlightInfo } from "../../utils/anvilTypes";
import { AnvilReduxActionTypes } from "./actionTypes";

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
    type: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
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
    type: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
    payload: {
      highlight,
      movedWidgets,
    },
  };
};

/**
 * Add suggested widget to Anvil canvas.
 */
export const addSuggestedWidgetAnvilAction = (newWidget: {
  newWidgetId: string;
  type?: string;
  rows?: number;
  columns?: number;
  props?: WidgetProps;
}) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_ADD_SUGGESTED_WIDGET,
    payload: {
      newWidget,
    },
  };
};
