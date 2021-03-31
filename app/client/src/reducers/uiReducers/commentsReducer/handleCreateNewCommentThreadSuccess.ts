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
  const { refId, id, applicationId } = action.payload;
  const applicationCommentThreadsByRef = get(
    state,
    `applicationCommentThreadsByRef.${applicationId}`,
    {},
  );
  const commentThreadsIdsForRefId = get(
    applicationCommentThreadsByRef,
    refId,
    [],
  );

  const calcApplicationCommentThreadsByRef = {
    ...state.applicationCommentThreadsByRef,
    [applicationId]: {
      ...applicationCommentThreadsByRef,
      [refId]: Array.from(new Set([...commentThreadsIdsForRefId, id])),
    },
  };

  return {
    ...state,
    applicationCommentThreadsByRef: calcApplicationCommentThreadsByRef,
    commentThreadsMap: {
      ...state.commentThreadsMap,
      [id]: action.payload,
    },
    creatingNewThread: false,
  };
};

export default handleCreateNewCommentThreadSuccess;
