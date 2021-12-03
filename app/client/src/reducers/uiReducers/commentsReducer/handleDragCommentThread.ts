import { DraggedCommentThread } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";
import { getNewDragPos } from "comments/utils";

const handleDragCommentThread = (
  state: CommentsReduxState,
  action: ReduxAction<DraggedCommentThread>,
) => {
  const {
    containerSizePosition,
    dragPosition,
    refId,
    widgetType,
  } = action.payload;
  const { draggingCommentThreadId, dragPointerOffset } = state;

  const position = getNewDragPos(
    {
      x: dragPosition.x + (dragPointerOffset ? dragPointerOffset.x : 0),
      y: dragPosition.y + (dragPointerOffset ? dragPointerOffset.y : 0),
    },
    containerSizePosition,
  );
  if (!draggingCommentThreadId) return state;
  const id = draggingCommentThreadId as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const { applicationId } = commentThreadInStore;
  if (!applicationId || !refId) return;

  const oldContainerRef = commentThreadInStore.refId;
  state.commentThreadsMap[id] = {
    ...(commentThreadInStore || {}),
    position,
    refId,
    widgetType,
  };
  if (refId === oldContainerRef) return { ...state };

  const commentThreadsIdsForRefId = get(
    state.applicationCommentThreadsByRef[applicationId],
    refId,
    [],
  );

  const commentThreadIdsForOldContainerRefId = get(
    state.applicationCommentThreadsByRef[applicationId],
    oldContainerRef,
    [],
  );

  state.applicationCommentThreadsByRef[applicationId] = {
    ...state.applicationCommentThreadsByRef[applicationId],
    [refId]: Array.from(new Set([id, ...commentThreadsIdsForRefId])),
    [oldContainerRef]: commentThreadIdsForOldContainerRefId.filter(
      (item) => item !== id,
    ),
  };

  return { ...state };
};

export default handleDragCommentThread;
