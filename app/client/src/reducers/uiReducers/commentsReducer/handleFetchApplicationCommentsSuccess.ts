import { ReduxAction } from "constants/ReduxActionConstants";
import { keyBy } from "lodash";
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
  if (action.payload.length === 0) return state;
  const applicationId = action.payload[0].applicationId;
  const applicationCommentIdsByRefId = action.payload.reduce(
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
