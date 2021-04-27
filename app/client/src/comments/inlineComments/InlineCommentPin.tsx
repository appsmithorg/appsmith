import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import CommentThread from "comments/CommentThread/CommentThread";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover } from "@blueprintjs/core";
import { get } from "lodash";
import {
  commentThreadsSelector,
  shouldShowResolved as shouldShowResolvedSelector,
} from "selectors/commentsSelectors";
import { getTypographyByKey } from "constants/DefaultTheme";
import { setIsCommentThreadVisible as setIsCommentThreadVisibleAction } from "actions/commentActions";
import { useTransition, animated } from "react-spring";
import { useLocation } from "react-router";

const CommentTriggerContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${(props) => props.top}%;
  left: ${(props) => props.left}%;
  z-index: 1;
`;

const useSelectCommentThreadUsingQuery = (commentThreadId: string) => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const commentThreadIdInUrl = searchParams.get("commentThreadId");
    if (commentThreadIdInUrl && commentThreadIdInUrl === commentThreadId) {
      const elements = document.getElementsByClassName(
        `comment-thread-pin-${commentThreadId}`,
      );
      const commentPin = elements && elements[0];
      commentPin?.scrollIntoView();
      // set comment thread visible after scrollIntoView is complete
      setTimeout(() => {
        dispatch(
          setIsCommentThreadVisibleAction({
            commentThreadId,
            isVisible: true,
          }),
        );
      });
    }
  }, [location]);
};

const StyledPinContainer = styled.div<{ unread: boolean }>`
  position: relative;
  & .pin-id {
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translate(-50%);
    color: ${(props) =>
      props.unread ? "#fff" : props.theme.colors.comments.pinId};
    ${(props) => getTypographyByKey(props, "p1")}
  }
  & svg {
    width: 46px;
    height: 46px;
  }
  cursor: pointer;
`;

const Pin = ({
  commentThreadId,
  // TODO remove default
  commentId = 1,
  unread = true,
}: {
  commentThreadId: string;
  commentId?: string | number;
  unread?: boolean;
}) => (
  <StyledPinContainer unread={unread}>
    <Icon
      className={`comment-thread-pin-${commentThreadId}`}
      name={unread ? "unread-pin" : "read-pin"}
      keepColors
      size={IconSize.XXL}
      data-cy={`t--inline-comment-pin-trigger-${commentThreadId}`}
    />
    <div className="pin-id">{commentId}</div>
  </StyledPinContainer>
);

const getCommentThreadIdFromURL = () => {
  const href = window.location.href;
  const searchParams = new URL(href).searchParams;
  const commentThreadIdURL = searchParams.get("commentThreadId") || null;

  return commentThreadIdURL || null;
};

/**
 * Comment pins that toggle comment thread popover visibility on click
 * They position themselves using position absolute based on top and left values (in percent)
 */
const InlineCommentPin = ({ commentThreadId }: { commentThreadId: string }) => {
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const { top, left } = get(commentThread, "position", {
    top: 0,
    left: 0,
  });

  const dispatch = useDispatch();
  const location = useLocation();

  const setIsCommentThreadVisible = (isVisible: boolean) =>
    dispatch(
      setIsCommentThreadVisibleAction({
        commentThreadId,
        isVisible,
      }),
    );

  useSelectCommentThreadUsingQuery(commentThreadId);

  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const isPinVisible =
    shouldShowResolved || !commentThread.resolvedState?.active;

  const transition = useTransition(isPinVisible, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 300 },
  });

  /**
   * Set visibility to false when navigating to another comment thread
   */
  const [commentThreadIdURL, setCommentThreadIdURL] = useState<string | null>(
    getCommentThreadIdFromURL(),
  );
  useEffect(() => {
    const newCommentThreadIdURL = getCommentThreadIdFromURL();

    if (
      newCommentThreadIdURL !== commentThreadId &&
      newCommentThreadIdURL !== commentThreadIdURL &&
      commentThread.isVisible
    ) {
      setIsCommentThreadVisible(false);
    }
    setCommentThreadIdURL(newCommentThreadIdURL);
  }, [location]);

  return (
    <>
      {transition.map(
        ({ item: show, props: springProps }: { item: boolean; props: any }) =>
          show ? (
            <animated.div style={springProps}>
              <CommentTriggerContainer
                top={top}
                left={left}
                onClick={(e: any) => {
                  // capture clicks so that create new thread is not triggered
                  e.preventDefault();
                  e.stopPropagation();
                }}
                data-cy="inline-comment-pin"
                draggable="true"
              >
                <Popover
                  hasBackdrop
                  autoFocus
                  canEscapeKeyClose
                  minimal
                  popoverClassName="comment-thread"
                  // isOpen is controlled so that newly created threads are set to be visible
                  isOpen={!!commentThread.isVisible}
                  onInteraction={(nextOpenState) => {
                    setIsCommentThreadVisible(nextOpenState);
                  }}
                  modifiers={{ preventOverflow: { enabled: true } }}
                >
                  <Pin commentThreadId={commentThreadId} />
                  <animated.div style={springProps}>
                    <CommentThread
                      isOpen={!!commentThread.isVisible}
                      commentThread={commentThread}
                      inline
                    />
                  </animated.div>
                </Popover>
              </CommentTriggerContainer>
            </animated.div>
          ) : null,
      )}
    </>
  );
};

export default InlineCommentPin;
