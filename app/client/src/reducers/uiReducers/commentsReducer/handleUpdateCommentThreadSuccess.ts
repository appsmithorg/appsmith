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

  if (!commentThreadInStore) return state;

  const pinnedStateChanged =
    commentThreadInStore?.pinnedState?.active !==
    action.payload?.pinnedState?.active;

  const isNowResolved =
    !commentThreadInStore?.resolvedState?.active &&
    action.payload?.resolvedState?.active;

  const shouldRefreshList = isNowResolved || pinnedStateChanged;

  state.commentThreadsMap[id] = {
    ...commentThreadInStore,
    ...action.payload,
    comments: existingComments,
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

  return {
    ...state,
    creatingNewThreadComment: false,
  };
};

export default handleUpdateCommentThreadSuccess;
