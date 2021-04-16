import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleUpdateCommentThreadSuccess = (
  state: CommentsReduxState,
  action: ReduxAction<Partial<CommentThread>>,
) => {
  const id = action.payload.id as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const existingComments = get(commentThreadInStore, "comments", []);

  state.commentThreadsMap[id] = {
    ...commentThreadInStore,
    ...action.payload,
    comments: existingComments,
  };

  return {
    ...state,
    creatingNewThreadComment: false,
  };
};

export default handleUpdateCommentThreadSuccess;
