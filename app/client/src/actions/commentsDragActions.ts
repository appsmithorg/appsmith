import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";

export const setDraggingCommentThread = (
  currentThreadId: string,
): ReduxAction<{ currentThreadId: string }> => ({
  type: ReduxActionTypes.SET_DRAGGING_COMMENT,
  payload: { currentThreadId },
});

export const dropThread = () => ({
  type: ReduxActionTypes.SET_HAS_DROPPED_THREAD,
  payload: {},
});
