import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import CommentCard from "comments/CommentCard/CommentCard";
import AddCommentInput from "comments/inlineComments/AddCommentInput";
import ScrollToLatest from "./ScrollToLatest";

import {
  addCommentToThreadRequest,
  markThreadAsReadRequest,
  resetVisibleThread,
  setCommentResolutionRequest,
  updateThreadDraftComment,
} from "actions/commentActions";

import {
  getDraftComments,
  shouldShowResolved as shouldShowResolvedSelector,
} from "selectors/commentsSelectors";

import useIsScrolledToBottom from "utils/hooks/useIsScrolledToBottom";

import { CommentThread } from "entities/Comments/CommentsInterfaces";
import { EditorState, RawDraftContentState } from "draft-js";

import styled, { withTheme } from "styled-components";
import { animated } from "react-spring";
import { AppState } from "reducers";
import { useEffect } from "react";
import { Theme } from "constants/DefaultTheme";

import { getAppMode } from "selectors/applicationSelectors";
import { getViewModePageList } from "selectors/editorSelectors";
import { APP_MODE } from "entities/App";

const ThreadContainer = styled(animated.div).withConfig({
  shouldForwardProp: (prop) =>
    !["visible", "inline", "maxHeight"].includes(prop),
})<{
  visible?: boolean;
  inline?: boolean;
  pinned?: boolean;
  maxHeight: string;
}>`
  width: ${(props) => (props.inline ? "280px" : "100%")};
  max-width: 100%;
  background-color: ${(props) =>
    props.inline
      ? "transparent"
      : props.pinned
      ? props.theme.colors.comments.pinnedThreadBackground
      : props.visible
      ? props.theme.colors.comments.visibleThreadBackground
      : "transparent"};
  max-height: ${(props) => props.maxHeight};
  /* overflow: auto collapses the comment threads in the sidebar */
  overflow: ${(props) => (props.inline ? "auto" : "unset")};
`;

const CommentsContainer = styled.div<{ inline?: boolean }>`
  position: relative;
`;

const ChildComments = styled.div`
  flex: 1;
`;

const CommentThreadContainer = withTheme(function CommentThreadContainer({
  commentThread,
  hideChildren,
  hideInput,
  inline,
  showSubheader,
  theme,
}: {
  commentThread: CommentThread;
  isOpen?: boolean;
  hideInput?: boolean;
  inline?: boolean;
  hideChildren?: boolean;
  showSubheader?: boolean;
  theme: Theme;
}) {
  const dispatch = useDispatch();
  const { comments, id: commentThreadId } = commentThread || {};
  const messagesBottomRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const isThreadVisible =
    shouldShowResolved || !commentThread?.resolvedState?.active;

  const isVisible = useSelector(
    (state: AppState) =>
      state.ui.comments.visibleCommentThreadId === commentThreadId,
  );

  useEffect(() => {
    if (isVisible && !commentThread?.isViewed) {
      dispatch(markThreadAsReadRequest(commentThreadId));
    }
  }, [isVisible, commentThread?.isViewed]);

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
        threadId: commentThread?.id,
        resolved: !commentThread?.resolvedState?.active,
      }),
    );
  };

  const parentComment = Array.isArray(comments) && comments[0];
  const childComments = Array.isArray(comments) && comments.slice(1);
  const numberOfReplies =
    (Array.isArray(childComments) && childComments.length) || 0;

  const handleCancel = () => dispatch(resetVisibleThread(commentThreadId));

  const appMode = useSelector(getAppMode);
  const pages = useSelector(getViewModePageList) || [];

  const inlineThreadHeightOffset =
    appMode === APP_MODE.PUBLISHED && pages.length > 1
      ? `calc(100vh - ${theme.smallHeaderHeight} - ${theme.smallHeaderHeight})` // to account for page tabs
      : `calc(100vh - ${theme.smallHeaderHeight})`;

  const maxHeight = inline ? inlineThreadHeightOffset : "unset";

  const draftComment = useSelector(
    (state: AppState) => getDraftComments(state)[commentThreadId],
  );

  const handleChange = (editorState: EditorState) => {
    dispatch(updateThreadDraftComment(editorState, commentThreadId));
  };

  if (!commentThread) return null;

  return isThreadVisible ? (
    <ThreadContainer
      inline={inline}
      maxHeight={maxHeight}
      pinned={commentThread.pinnedState?.active}
      tabIndex={0}
      visible={isVisible}
    >
      <div style={{ position: "relative" }}>
        <CommentsContainer inline={inline} ref={commentsContainerRef}>
          {parentComment && (
            <CommentCard
              comment={parentComment}
              commentThreadId={commentThreadId}
              inline={inline}
              isParentComment
              key={parentComment.id}
              numberOfReplies={numberOfReplies}
              resolved={!!commentThread?.resolvedState?.active}
              showReplies={hideChildren}
              showSubheader={showSubheader}
              toggleResolved={resolveCommentThread}
              unread={!commentThread?.isViewed}
              visible={isVisible}
            />
          )}
          {!hideChildren && childComments && childComments.length > 0 && (
            <ChildComments>
              {childComments.map((comment) => (
                <CommentCard
                  comment={comment}
                  commentThreadId={commentThreadId}
                  inline={inline}
                  key={comment.id}
                  visible={isVisible}
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
      {!hideInput && (
        <AddCommentInput
          initialEditorState={draftComment}
          onCancel={handleCancel}
          onChange={handleChange}
          onSave={addComment}
        />
      )}
    </ThreadContainer>
  ) : null;
});

export default CommentThreadContainer;
