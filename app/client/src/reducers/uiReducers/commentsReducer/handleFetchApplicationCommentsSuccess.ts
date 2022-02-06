import { ReduxAction } from "constants/ReduxActionConstants";
import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { keyBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

/**
 * Reset application threads map: { appId: { ref1: threadIds, ref2: threadIds, ... } }
 * Update common threads store
 */
const handleFetchApplicationCommentsSuccess = (
  state: CommentsReduxState,
  action: ReduxAction<{
    commentThreads: CommentThread[];
    applicationId: string;
  }>,
) => {
  const { applicationId, commentThreads } = action.payload;
  const applicationCommentsMap = keyBy(commentThreads, "id");

  const applicationCommentIdsByRefId = commentThreads.reduce(
    (res: any, curr: any) => {
      if (!res[curr.refId]) res[curr.refId] = [];
      res[curr.refId].push(curr.id);
      return res;
    },
    {},
  );

  state.applicationCommentThreadsByRef[
    applicationId
  ] = applicationCommentIdsByRefId;

  state.commentThreadsMap = {
    ...state.commentThreadsMap,
    ...applicationCommentsMap,
  };

  return { ...state, commentThreadsFetched: true };
};

export default handleFetchApplicationCommentsSuccess;
