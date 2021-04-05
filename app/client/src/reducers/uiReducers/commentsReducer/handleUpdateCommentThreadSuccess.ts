import { CommentThread } from "components/ads/Comments/CommentsInterfaces";
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

  return {
    ...state,
    commentThreadsMap: {
      ...state.commentThreadsMap,
      [id]: {
        ...commentThreadInStore,
        ...action.payload,
        comments: existingComments,
      },
    },
    creatingNewThreadComment: false,
  };
};

export default handleUpdateCommentThreadSuccess;
