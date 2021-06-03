import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get, uniqBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

// TODO verify cases where commentThread can be undefined for update event
const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<Partial<CommentThread & { _id: string }>>,
) => {
  const id = action.payload._id as string;
  const commentThreadInStore = state.commentThreadsMap[id];
  const existingComments = get(commentThreadInStore, "comments", []);
  const newComments = get(action.payload, "comments", []);

  const pinnedStateChanged =
    commentThreadInStore?.pinnedState?.active !==
    action.payload?.pinnedState?.active;

  const isNowResolved =
    !commentThreadInStore?.resolvedState?.active &&
    action.payload?.resolvedState?.active;

  const shouldRefreshList = isNowResolved || pinnedStateChanged;

  state.commentThreadsMap[id] = {
    ...(commentThreadInStore || {}),
    ...action.payload,
    isViewed: commentThreadInStore?.isViewed || action.payload.isViewed, // TODO refactor this
    comments: uniqBy([...existingComments, ...newComments], "id"),
  };

  if (shouldRefreshList) {
    state.applicationCommentThreadsByRef[
      action.payload.applicationId as string
    ] = {
      ...state.applicationCommentThreadsByRef[
        action.payload.applicationId as string
      ],
    };
  }

  const showUnreadIndicator = !state.isCommentMode;

  return { ...state, showUnreadIndicator };
};

export default handleUpdateCommentThreadEvent;
