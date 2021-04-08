import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import CommentCard from "comments/CommentCard/CommentCard";
import AddCommentInput from "comments/inlineComments/AddCommentInput";
import ResolveCommentButton from "comments/CommentCard/ResolveCommentButton";
import {
  ThreadContainer,
  ThreadHeader,
  ThreadHeaderTitle,
  CommentsContainer,
} from "./StyledComponents";
import ScrollToLatest from "./ScrollToLatest";

import {
  addCommentToThreadRequest,
  setCommentResolutionRequest,
} from "actions/commentActions";

import useIsScrolledToBottom from "utils/hooks/useIsScrolledToBottom";

import { CommentThread } from "entities/Comments/CommentsInterfaces";

/**
 * Comment thread popover
 */
const InlineCommentThreadContainer = ({
  commentThread,
  isOpen,
}: {
  commentThread: CommentThread;
  isOpen: boolean;
}) => {
  const dispatch = useDispatch();
  const { comments } = commentThread;
  const messagesBottomRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [isOpen]);

  // Check if the comments window is scrolled to the bottom
  // We don't autoscroll for the user receiving the updates
  // for better UX, instead we'd show a helper message to indicate
  const isScrolledToBottom = useIsScrolledToBottom(commentsContainerRef, [
    comments,
  ]);

  const addComment = (text: string) => {
    dispatch(
      addCommentToThreadRequest({
        commentThread,
        commentBody: text,
        // scroll to bottom when the user creates a new comment
        // should be called once the comment is rendered on the dom
        callback: scrollToBottom,
      }),
    );
  };

  const scrollToBottom = () => {
    if (typeof messagesBottomRef.current?.scrollIntoView === "function")
      messagesBottomRef.current?.scrollIntoView();
  };

  const resolveCommentThread = () => {
    dispatch(
      setCommentResolutionRequest({
        threadId: commentThread.id,
        resolved: !commentThread.resolved,
      }),
    );
  };

  return (
    <ThreadContainer tabIndex={0}>
      <ThreadHeader>
        <ThreadHeaderTitle>Comments</ThreadHeaderTitle>
        <ResolveCommentButton
          resolved={!!commentThread.resolved}
          handleClick={resolveCommentThread}
        />
      </ThreadHeader>
      <div style={{ position: "relative" }}>
        <CommentsContainer ref={commentsContainerRef}>
          {comments &&
            comments.map((comment, index) => (
              <CommentCard key={index} comment={comment} />
            ))}
          <div ref={messagesBottomRef} />
        </CommentsContainer>
        {!isScrolledToBottom && (
          <ScrollToLatest scrollToBottom={scrollToBottom} />
        )}
      </div>
      <AddCommentInput onSave={addComment} />
    </ThreadContainer>
  );
};

export default InlineCommentThreadContainer;
