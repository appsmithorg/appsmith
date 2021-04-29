import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleAddCommentToThreadSuccess = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const { commentThreadId, comment } = action.payload;
  const commentThreadInStore = state.commentThreadsMap[commentThreadId];
  const existingComments = get(commentThreadInStore, "comments", []);
  state.commentThreadsMap[commentThreadId] = {
    ...commentThreadInStore,
    comments: Array.from(new Set([...existingComments, comment])),
  };

  return { ...state };
};

export default handleAddCommentToThreadSuccess;
