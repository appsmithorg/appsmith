import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import {
  AnchorWidget,
  CommentPinLocation,
} from "../reducers/uiReducers/commentsReducer/commentsDragReducer";

export const setDraggingCommentThread = (
  currentThreadId: string,
): ReduxAction<{ currentThreadId: string }> => ({
  type: ReduxActionTypes.SET_DRAGGING_COMMENT,
  payload: { currentThreadId },
});

export const dropThread = (
  dropLocation?: CommentPinLocation | null,
): ReduxAction<{ dropLocation?: CommentPinLocation | null }> => ({
  type: ReduxActionTypes.SET_HAS_DROPPED_THREAD,
  payload: { dropLocation },
});

export const setAnchorWidget = (
  anchorWidget?: AnchorWidget | null,
): ReduxAction<{ anchorWidget?: AnchorWidget | null }> => ({
  type: ReduxActionTypes.SET_DRAGGED_THREAD_ANCHOR_WIDGET,
  payload: { anchorWidget },
});
