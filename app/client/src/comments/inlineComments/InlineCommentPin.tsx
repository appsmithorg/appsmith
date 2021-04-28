import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import CommentThread from "comments/CommentThread/CommentThread";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover, Position } from "@blueprintjs/core";
import { get } from "lodash";
import {
  commentThreadsSelector,
  shouldShowResolved as shouldShowResolvedSelector,
} from "selectors/commentsSelectors";
import { getTypographyByKey } from "constants/DefaultTheme";
import { setVisibleThread, resetVisibleThread } from "actions/commentActions";
import { useTransition, animated } from "react-spring";
import { useLocation } from "react-router";
import scrollIntoView from "scroll-into-view-if-needed";
import { AppState } from "reducers";

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
      if (commentPin) {
        scrollIntoView(commentPin, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        });
      }
      // set comment thread visible after scrollIntoView is complete
      setTimeout(() => {
        dispatch(setVisibleThread(commentThreadId));
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
    max-width: 25px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  & svg {
    width: 30px;
    height: 30px;
    box-shadow: 0px 8px 10px rgb(0 0 0 / 15%);
    border-radius: 15px;
    overflow: visible;
  }
  cursor: pointer;
`;

function Pin({
  commentThreadId,
  // TODO remove default
  sequenceId = "",
  unread = true,
}: {
  commentThreadId: string;
  sequenceId?: string;
  unread?: boolean;
}) {
  return (
    <StyledPinContainer unread={unread}>
      <Icon
        className={`comment-thread-pin-${commentThreadId}`}
        data-cy={`t--inline-comment-pin-trigger-${commentThreadId}`}
        keepColors
        name={unread ? "unread-pin" : "read-pin"}
        size={IconSize.XXL}
      />
      <div className="pin-id">{sequenceId.slice(1)}</div>
    </StyledPinContainer>
  );
}

/**
 * Comment pins that toggle comment thread popover visibility on click
 * They position themselves using position absolute based on top and left values (in percent)
 */
function InlineCommentPin({ commentThreadId }: { commentThreadId: string }) {
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const { top, left } = get(commentThread, "position", {
    top: 0,
    left: 0,
  });

  const dispatch = useDispatch();

  useSelectCommentThreadUsingQuery(commentThreadId);

  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const isPinVisible =
    shouldShowResolved || !commentThread.resolvedState?.active;
  const isCommentThreadVisible = useSelector(
    (state: AppState) =>
      state.ui.comments.visibleCommentThreadId === commentThreadId,
  );

  const transition = useTransition(isPinVisible, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 300 },
  });

  return (
    <>
      {transition.map(
        ({ item: show, props: springProps }: { item: boolean; props: any }) =>
          show ? (
            <animated.div style={springProps}>
              <CommentTriggerContainer
                data-cy="inline-comment-pin"
                draggable="true"
                left={left}
                onClick={(e: any) => {
                  // capture clicks so that create new thread is not triggered
                  e.preventDefault();
                  e.stopPropagation();
                }}
                top={top}
              >
                <Popover
                  autoFocus
                  canEscapeKeyClose
                  hasBackdrop
                  isOpen={!!isCommentThreadVisible}
                  minimal
                  // isOpen is controlled so that newly created threads are set to be visible
                  modifiers={{
                    preventOverflow: { enabled: true },
                    offset: {
                      enabled: true,
                      offset: "-8, 10",
                    },
                  }}
                  onInteraction={(nextOpenState) => {
                    if (nextOpenState) {
                      dispatch(setVisibleThread(commentThreadId));
                    } else {
                      dispatch(resetVisibleThread(commentThreadId));
                    }
                  }}
                  popoverClassName="comment-thread"
                  position={Position.RIGHT_TOP}
                >
                  <Pin
                    commentThreadId={commentThreadId}
                    sequenceId={commentThread.sequenceId}
                  />
                  <animated.div style={springProps}>
                    <CommentThread
                      commentThread={commentThread}
                      inline
                      isOpen={!!isCommentThreadVisible}
                    />
                  </animated.div>
                </Popover>
              </CommentTriggerContainer>
            </animated.div>
          ) : null,
      )}
    </>
  );
}

export default InlineCommentPin;
