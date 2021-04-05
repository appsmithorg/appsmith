import { CommentThread } from "components/ads/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<Partial<CommentThread & { _id: string }>>,
) => {
  const id = action.payload._id as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const existingComments = get(commentThreadInStore, "comments", []);

  return {
    ...state,
    commentThreadsMap: {
      ...state.commentThreadsMap,
      // Update comment thread event doesn't contain comments
      // Its corollary to db notifications, comments might be received
      // as a separate event
      [id]: {
        ...commentThreadInStore,
        ...action.payload,
        comments: existingComments,
      },
    },
    creatingNewThreadComment: false,
  };
};

export default handleUpdateCommentThreadEvent;
