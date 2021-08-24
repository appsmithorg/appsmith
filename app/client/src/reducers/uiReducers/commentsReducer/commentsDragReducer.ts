import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetType } from "../../../constants/WidgetConstants";

export type CommentPinLocation = {
  x: number;
  y: number;
};
export type AnchorWidget = { id: string; type: WidgetType };

export type CommentDragState = {
  isDragging: boolean;
  currentThreadId?: string | null;
  hasDropped: boolean;
  dropLocation?: CommentPinLocation | null;
  anchorWidget?: AnchorWidget | null;
};

const initialState: CommentDragState = {
  isDragging: false,
  currentThreadId: null,
  hasDropped: false,
  dropLocation: null,
  anchorWidget: null,
};

const commentsDraggingReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_DRAGGING_COMMENT]: (
    state: CommentDragState,
    action: ReduxAction<{
      currentThreadId: string;
    }>,
  ) => {
    state.isDragging = true;
    state.hasDropped = false;
    state.dropLocation = null;
    state.currentThreadId = action.payload.currentThreadId;
  },
  [ReduxActionTypes.SET_DRAGGED_THREAD_ANCHOR_WIDGET]: (
    state: CommentDragState,
    action: ReduxAction<{
      anchorWidget?: AnchorWidget | null;
    }>,
  ) => {
    state.anchorWidget = action.payload.anchorWidget;
  },
  [ReduxActionTypes.SET_HAS_DROPPED_THREAD]: (
    state: CommentDragState,
    action: ReduxAction<{
      dropLocation?: CommentPinLocation | null;
    }>,
  ) => {
    state.hasDropped = true;
    state.isDragging = false;
    state.anchorWidget = null;
    state.dropLocation = action.payload.dropLocation;
  },
});

export default commentsDraggingReducer;
