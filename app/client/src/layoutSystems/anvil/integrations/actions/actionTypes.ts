import type { AnvilDragMeta } from "layoutSystems/anvil/editor/canvasArenas/types";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";

export interface AnvilReduxAction<T> {
  type: AnvilReduxActionTypes;
  payload: T;
}

export interface AnvilMoveWidgetsPayload {
  highlight: AnvilHighlightInfo;
  movedWidgets: DraggedWidget[];
  dragMeta: AnvilDragMeta;
}

export interface AnvilNewWidgetsPayload {
  highlight: AnvilHighlightInfo;
  dragMeta: AnvilDragMeta;
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
    detachFromLayout: boolean;
  };
}

export enum AnvilReduxActionTypes {
  READ_LAYOUT_ELEMENT_POSITIONS = "READ_LAYOUT_ELEMENT_POSITIONS",
  UPDATE_LAYOUT_ELEMENT_POSITIONS = "UPDATE_LAYOUT_ELEMENT_POSITIONS",
  REMOVE_LAYOUT_ELEMENT_POSITIONS = "REMOVE_LAYOUT_ELEMENT_POSITIONS",
  ANVIL_ADD_NEW_WIDGET = "ANVIL_ADD_NEW_WIDGET",
  ANVIL_MOVE_WIDGET = "ANVIL_MOVE_WIDGET",
  ANVIL_ADD_SUGGESTED_WIDGET = "ANVIL_ADD_SUGGESTED_WIDGET",
  ANVIL_SECTION_ZONES_UPDATE = "ANVIL_SECTION_ZONES_UPDATE",
  ANVIL_SPACE_DISTRIBUTION_START = "ANVIL_SPACE_DISTRIBUTION_START",
  ANVIL_SPACE_DISTRIBUTION_UPDATE = "ANVIL_SPACE_DISTRIBUTION_UPDATE",
  ANVIL_SPACE_DISTRIBUTION_STOP = "ANVIL_SPACE_DISTRIBUTION_STOP",
  ANVIL_SET_HIGHLIGHT_SHOWN = "ANVIL_SET_HIGHLIGHT_SHOWN",
  ANVIL_WIDGET_SELECTION_CLICK = "ANVIL_WIDGET_SELECTION_CLICK",
  // Until the IDE or Integrations Pod provides an API
  DEBUG_WIDGET = "DEBUG_WIDGET",
}
