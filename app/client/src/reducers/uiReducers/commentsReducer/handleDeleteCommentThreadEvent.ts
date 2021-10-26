import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { CommentsReduxState } from "./interfaces";
import { deleteCommentThreadFromState } from "./common";

const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<CommentThread>,
) => {
  const { _id: commentThreadId, applicationId } = action.payload;

  const updatedState = deleteCommentThreadFromState(
    state,
    commentThreadId,
    applicationId,
  );

  return {
    ...updatedState,
    lastUpdatedCommentThreadByAppId: {
      ...updatedState.lastUpdatedCommentThreadByAppId,
      [applicationId]: commentThreadId,
    },
  };
};

export default handleUpdateCommentThreadEvent;
