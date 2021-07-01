import { ReduxAction } from "constants/ReduxActionConstants";
import { get, uniqBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleAddCommentToThreadSuccess = (
  state: CommentsReduxState,
  action: ReduxAction<any>,
) => {
  const { comment, commentThreadId } = action.payload;
  const commentThreadInStore = state.commentThreadsMap[commentThreadId];
  const existingComments = get(commentThreadInStore, "comments", []);
  state.commentThreadsMap[commentThreadId] = {
    ...commentThreadInStore,
    comments: uniqBy([...existingComments, comment], "id"),
  };

  return { ...state };
};

export default handleAddCommentToThreadSuccess;
