import { ReduxAction } from "constants/ReduxActionConstants";
import { get, keyBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

/**
 * Reset application threads map: { appId: { ref1: threadIds, ref2: threadIds, ... } }
 * Update common threads store
 */
const handleFetchApplicationCommentsSuccess = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const applicationCommentsMap = keyBy(action.payload, "id");
  const applicationCommentIdsByRefId = action.payload.reduce(
    (res: any, curr: any) => {
      const applicationCommentIds = res[curr.applicationId] || {};
      const applicationCommentIdsForRefId = get(
        applicationCommentIds,
        curr.refId,
        [],
      );

      return {
        [curr.applicationId]: {
          ...applicationCommentIds,
          [curr.refId]: Array.from(
            new Set([...applicationCommentIdsForRefId, curr.id]),
          ),
        },
      };
    },
    {},
  );

  return {
    ...state,
    applicationCommentThreadsByRef: {
      ...state.applicationCommentThreadsByRef,
      ...applicationCommentIdsByRefId,
    },
    commentThreadsMap: {
      ...state.commentThreadsMap,
      ...applicationCommentsMap,
    },
  };
};

export default handleFetchApplicationCommentsSuccess;
