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

const ThreadContainer = styled.div`
  width: 400px;
  max-width: 100%;
`;

const CommentsContainer = styled.div<{ inline?: boolean }>`
  position: relative;
  max-height: ${(props) => (!props.inline ? "unset" : "285px")};
  overflow: auto;
`;

const ChildCommentsContainer = styled.div`
  display: flex;
`;

const ChildCommentIndent = styled.div`
  width: 1px;
  background-color: ${(props) =>
    props.theme.colors.comments.childCommentsIndent};
  margin-left: ${(props) => props.theme.spaces[11]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  margin-top: ${(props) => props.theme.spaces[5]}px;
`;

const ChildComments = styled.div`
  flex: 1;
`;

function CommentThreadContainer({
  commentThread,
  hideInput,
  inline,
}: {
  commentThread: CommentThread;
  isOpen?: boolean;
  hideInput?: boolean;
  inline?: boolean;
}) {
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
        resolved: !commentThread.resolved,
      }),
    );
  };

  const parentComment = Array.isArray(comments) && comments[0];
  const childComments = Array.isArray(comments) && comments.slice(1);

  return (
    <ThreadContainer tabIndex={0}>
      <div style={{ position: "relative" }}>
        <CommentsContainer inline={inline} ref={commentsContainerRef}>
          {parentComment && (
            <CommentCard
              comment={parentComment}
              commentThreadId={commentThreadId}
              isParentComment
              key={parentComment.id}
              resolved={!!commentThread.resolved}
              toggleResolved={resolveCommentThread}
            />
          )}
          {childComments && childComments.length > 0 && (
            <ChildCommentsContainer>
              <ChildCommentIndent />
              <ChildComments>
                {childComments.map((comment) => (
                  <CommentCard
                    comment={comment}
                    commentThreadId={commentThreadId}
                    key={comment.id}
                  />
                ))}
              </ChildComments>
            </ChildCommentsContainer>
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
}

export default CommentThreadContainer;
