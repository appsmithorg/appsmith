import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type CommentDragState = {
  isDragging: boolean;
  currentThreadId?: string | null;
};

const initialState: CommentDragState = {
  isDragging: false,
  currentThreadId: null,
};

const commentsDraggingReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_DRAGGING_COMMENT]: (
    state: CommentDragState,
    action: ReduxAction<{
      currentThreadId: string;
    }>,
  ) => {
    state.isDragging = true;
    state.currentThreadId = action.payload.currentThreadId;
  },
  [ReduxActionTypes.SET_HAS_DROPPED_THREAD]: (state: CommentDragState) => {
    state.currentThreadId = null;
    state.isDragging = false;
  },
});

export default commentsDraggingReducer;
