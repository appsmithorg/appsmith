import { Comment } from "entities/Comments/CommentsInterfaces";
import { ReduxAction } from "constants/ReduxActionConstants";
import { get, uniqBy } from "lodash";
import { CommentsReduxState } from "./interfaces";

const handleUpdateCommentThreadEvent = (
  state: CommentsReduxState,
  action: ReduxAction<Comment>,
) => {
  const { threadId, _id } = action.payload;

  const threadInState = state.commentThreadsMap[threadId as string];
  const commentIdx = threadInState.comments.findIndex(
    (comment) => comment.id === _id,
  );
  threadInState.comments.splice(commentIdx, 1, { ...action.payload, id: _id });
  state.commentThreadsMap[threadId as string] = { ...threadInState };

  return { ...state };
};

export default handleUpdateCommentThreadEvent;
