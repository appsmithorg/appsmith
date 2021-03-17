import React from "react";
import { useDispatch } from "react-redux";

import CommentCard from "./CommentCard";
import AddCommentInput from "./AddCommentInput";
import ResolveCommentButton from "./ResolveCommentButton";
import {
  ThreadContainer,
  ThreadHeader,
  ThreadHeaderTitle,
  CommentsContainer,
} from "./StyledComponents";

import {
  addCommentToThreadRequest,
  resolveCommentThread as resolveCommentThreadAction,
} from "actions/commentActions";
import { CommentThread } from "reducers/uiReducers/commentsReducer";

const InlineCommentThreadContainer = ({
  commentThread,
}: {
  commentThread: CommentThread;
}) => {
  const dispatch = useDispatch();
  const { comments } = commentThread;
  const addComment = (text: string) => {
    dispatch(
      addCommentToThreadRequest({
        commentThread,
        commentBody: text,
      }),
    );
  };

  const resolveCommentThread = () => {
    dispatch(resolveCommentThreadAction({ commentThreadId: commentThread.id }));
  };

  return (
    <ThreadContainer>
      <ThreadHeader>
        <ThreadHeaderTitle>Comments</ThreadHeaderTitle>
        <ResolveCommentButton handleClick={resolveCommentThread} />
      </ThreadHeader>
      <CommentsContainer>
        {comments &&
          comments.map((comment, index) => (
            <CommentCard key={index} comment={comment} />
          ))}
      </CommentsContainer>
      <AddCommentInput onSave={addComment} />
    </ThreadContainer>
  );
};

export default InlineCommentThreadContainer;
