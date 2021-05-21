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

  const shouldRefreshList =
    commentThreadInStore.pinnedState?.active !==
    action.payload?.pinnedState?.active;

  state.commentThreadsMap[id] = {
    ...commentThreadInStore,
    ...action.payload,
    comments: existingComments,
  };

  // Refresh app comments section list
  // TODO: can perform better if we have separate lists calculated in advance
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
