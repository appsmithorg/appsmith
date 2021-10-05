import { connect } from "react-redux";
import { AppState } from "reducers";
import { commentThreadsSelector } from "selectors/commentsSelectors";
import CommentThread from "./CommentThread";

const mapStateToProps = (
  state: AppState,
  props: { commentThreadId: string },
) => {
  const commentThread = commentThreadsSelector(props.commentThreadId)(state);

  return {
    commentThread,
  };
};

const connectedCommentThread = connect(mapStateToProps)(CommentThread);

export default connectedCommentThread;
