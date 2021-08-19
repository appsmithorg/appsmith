import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

// TODO verify cases where commentThread can be undefined for update event
const handleDragCommentThread = (
  state: CommentsReduxState,
  action: ReduxAction<Partial<CommentThread & { _id: string }>>,
) => {
  const { applicationId, refId } = action.payload;
  if (!applicationId || !refId) return;
  const id = (action.payload._id || action.payload.id) as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const oldContainerRef = commentThreadInStore.refId;
  state.commentThreadsMap[id] = {
    ...(commentThreadInStore || {}),
    ...action.payload,
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
