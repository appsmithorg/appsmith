import type { AnvilDragMeta } from "layoutSystems/anvil/editor/canvasArenas/types";
import type { WidgetProps } from "widgets/BaseWidget";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";
import type {
  AnvilMoveWidgetsPayload,
  AnvilNewWidgetsPayload,
} from "./actionTypes";
import { AnvilReduxActionTypes } from "./actionTypes";

export const setHighlightsDrawnAction = (highlight?: AnvilHighlightInfo) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SET_HIGHLIGHT_SHOWN,
    payload: {
      highlight,
    },
  };
};
/**
 * Add new anvil widget to canvas.
 */
export const addNewAnvilWidgetAction = (
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
    detachFromLayout: boolean;
  },
  highlight: AnvilHighlightInfo,
  dragMeta: AnvilDragMeta,
) => {
  const payload: AnvilNewWidgetsPayload = {
    highlight,
    newWidget,
    dragMeta,
  };

  return {
    type: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
    payload,
  };
};

/**
 * Move existing widgets.
 */
export const moveAnvilWidgets = (
  highlight: AnvilHighlightInfo,
  movedWidgets: DraggedWidget[],
  dragMeta: AnvilDragMeta,
) => {
  const payload: AnvilMoveWidgetsPayload = {
    highlight,
    movedWidgets,
    dragMeta,
  };

  return {
    type: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
    payload,
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
