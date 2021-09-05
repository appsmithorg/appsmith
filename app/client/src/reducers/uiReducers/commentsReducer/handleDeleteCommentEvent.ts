import { Comment } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { CommentsReduxState } from "./interfaces";
import { deleteCommentFromState } from "./common";

const handleDeleteCommentEvent = (
  state: CommentsReduxState,
  action: ReduxAction<Comment>,
) => {
  const { _id: commentId, threadId } = action.payload;

  const updatedState = deleteCommentFromState(state, commentId, threadId);

  return { ...updatedState };
};

export default handleDeleteCommentEvent;
