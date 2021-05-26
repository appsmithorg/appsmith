import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get, uniqBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<Partial<CommentThread & { _id: string }>>,
) => {
  const id = action.payload._id as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const existingComments = get(commentThreadInStore, "comments", []);
  const newComments = get(action.payload, "comments", []);
  state.commentThreadsMap[id] = {
    ...commentThreadInStore,
    ...action.payload,
    isViewed: commentThreadInStore.isViewed || action.payload.isViewed, // TODO refactor this
    comments: uniqBy([...existingComments, ...newComments], "id"),
  };

  const showUnreadIndicator = !state.isCommentMode;

  return { ...state, showUnreadIndicator };
};

export default handleUpdateCommentThreadEvent;
