import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

/**
 * Append threadId to { refId: commentThreadId[] }
 * Update commentThreads map with newly created thread
 */
const handleCreateNewCommentThreadSuccess = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const { applicationId, id, refId } = action.payload;

  state.commentThreadsMap[id] = action.payload;

  if (!state.applicationCommentThreadsByRef[applicationId]) {
    state.applicationCommentThreadsByRef[applicationId] = {};
  }

  const commentThreadsIdsForRefId = get(
    state.applicationCommentThreadsByRef[applicationId],
    refId,
    [],
  );

  state.applicationCommentThreadsByRef[applicationId] = {
    ...state.applicationCommentThreadsByRef[applicationId],
    [refId]: Array.from(new Set([id, ...commentThreadsIdsForRefId])),
  };

  return { ...state };
};

export default handleCreateNewCommentThreadSuccess;
