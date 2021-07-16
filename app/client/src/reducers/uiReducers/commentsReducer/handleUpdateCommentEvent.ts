import { Comment } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { CommentsReduxState } from "./interfaces";

const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<Comment>,
) => {
  const { _id, threadId } = action.payload;

  const threadInState = state.commentThreadsMap[threadId as string];

  if (!threadInState) return state;

  const commentIdx = threadInState.comments.findIndex(
    (comment) => comment.id === _id,
  );
  threadInState.comments.splice(commentIdx, 1, { ...action.payload, id: _id });
  state.commentThreadsMap[threadId as string] = { ...threadInState };

  return { ...state };
};

export default handleUpdateCommentThreadEvent;
