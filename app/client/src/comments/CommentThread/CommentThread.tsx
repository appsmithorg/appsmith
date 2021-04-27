import React, { useRef } from "react";
import { useDispatch } from "react-redux";

import CommentCard from "comments/CommentCard/CommentCard";
import AddCommentInput from "comments/inlineComments/AddCommentInput";
import ScrollToLatest from "./ScrollToLatest";

import {
  addCommentToThreadRequest,
  setCommentResolutionRequest,
} from "actions/commentActions";

import useIsScrolledToBottom from "utils/hooks/useIsScrolledToBottom";

import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { RawDraftContentState } from "draft-js";

import styled from "styled-components";
import { animated } from "react-spring";

const ThreadContainer = styled(animated.div)<{
  visible?: boolean;
  inline?: boolean;
  pinned?: boolean;
}>`
  width: 280px;
  max-width: 100%;
  background-color: ${(props) =>
    props.inline
      ? "transparent"
      : props.pinned
      ? props.theme.colors.comments.pinnedThreadBackground
      : props.visible
      ? props.theme.colors.comments.visibleThreadBackground
      : "transparent"};
`;

const CommentsContainer = styled.div<{ inline?: boolean }>`
  position: relative;
  max-height: ${(props) => (!props.inline ? "unset" : "285px")};
  overflow: auto;
`;

const ChildComments = styled.div`
  flex: 1;
`;

const CommentThreadContainer = ({
  commentThread,
  hideInput,
  inline,
  hideChildren,
  transition,
  showSubheader,
}: {
  commentThread: CommentThread;
  isOpen?: boolean;
  hideInput?: boolean;
  inline?: boolean;
  hideChildren?: boolean;
  transition?: any;
  showSubheader?: boolean;
}) => {
  const dispatch = useDispatch();
  const { comments, id: commentThreadId } = commentThread;
  const messagesBottomRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Check if the comments window is scrolled to the bottom
  // We don't autoscroll for the user receiving the updates
  // for better UX, instead we'd show a helper message to indicate
  const isScrolledToBottom = useIsScrolledToBottom(commentsContainerRef, [
    comments,
  ]);

  const addComment = (text: RawDraftContentState) => {
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
    if (
      typeof messagesBottomRef.current?.scrollIntoView === "function" &&
      inline
    )
      messagesBottomRef.current?.scrollIntoView();
  };

  const resolveCommentThread = () => {
    dispatch(
      setCommentResolutionRequest({
        threadId: commentThread.id,
        resolved: !commentThread.resolvedState?.active,
      }),
    );
  };

  const parentComment = Array.isArray(comments) && comments[0];
  const childComments = Array.isArray(comments) && comments.slice(1);
  const numberOfReplies =
    (Array.isArray(childComments) && childComments.length) || 0;

  return (
    <ThreadContainer
      tabIndex={0}
      style={transition}
      inline={inline}
      visible={commentThread.isVisible}
      pinned={commentThread.pinnedState?.active}
    >
      <div style={{ position: "relative" }}>
        <CommentsContainer ref={commentsContainerRef} inline={inline}>
          {parentComment && (
            <CommentCard
              commentThreadId={commentThreadId}
              key={parentComment.id}
              comment={parentComment}
              resolved={!!commentThread.resolvedState?.active}
              toggleResolved={resolveCommentThread}
              isParentComment
              numberOfReplies={numberOfReplies}
              showReplies={hideChildren}
              showSubheader={showSubheader}
              inline={inline}
            />
          )}
          {!hideChildren && childComments && childComments.length > 0 && (
            <ChildComments>
              {childComments.map((comment) => (
                <CommentCard
                  commentThreadId={commentThreadId}
                  key={comment.id}
                  comment={comment}
                  inline={inline}
                />
              ))}
            </ChildComments>
          )}
          <div ref={messagesBottomRef} />
        </CommentsContainer>
        {!isScrolledToBottom && (
          <ScrollToLatest scrollToBottom={scrollToBottom} />
        )}
      </div>
      {!hideInput && <AddCommentInput onSave={addComment} />}
    </ThreadContainer>
  );
};

export default CommentThreadContainer;
