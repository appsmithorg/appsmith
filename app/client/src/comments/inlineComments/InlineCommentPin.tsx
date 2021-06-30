import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import CommentThread from "comments/CommentThread/CommentThread";
import Icon, { IconSize } from "components/ads/Icon";
import { get } from "lodash";
import {
  commentThreadsSelector,
  shouldShowResolved as shouldShowResolvedSelector,
} from "selectors/commentsSelectors";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  setVisibleThread,
  resetVisibleThread,
  markThreadAsReadRequest,
} from "actions/commentActions";
import scrollIntoView from "scroll-into-view-if-needed";
import { AppState } from "reducers";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { Popover2 } from "@blueprintjs/popover2";

/**
 * The relavent pixel position is bottom right for the comment cursor
 * instead of the top left for the default arrow cursor
 */
const CommentTriggerContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  bottom: calc(${(props) => 100 - props.top}% - 2px);
  right: calc(${(props) => 100 - props.left}% - 2px);
  z-index: 1;
`;

const StyledPinContainer = styled.div<{ unread?: boolean }>`
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
  onClick,
  sequenceId = "",
  unread,
}: {
  commentThreadId: string;
  sequenceId?: string;
  unread?: boolean;
  onClick: () => void;
}) {
  return (
    <StyledPinContainer onClick={onClick} unread={unread}>
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

const Container = document.getElementById("root");

const modifiers = {
  preventOverflow: { enabled: true },
  offset: {
    enabled: true,
    options: {
      offset: [-8, 10] as [
        number | null | undefined,
        number | null | undefined,
      ],
    },
  },
};

const focusThread = (commentThreadId: string) => {
  if (commentThreadId) {
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
  }
};

/**
 * Comment pins that toggle comment thread popover visibility on click
 * They position themselves using position absolute based on top and left values (in percent)
 */
function InlineCommentPin({
  commentThreadId,
  focused,
}: {
  commentThreadId: string;
  focused: boolean;
}) {
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const { left, top } = get(commentThread, "position", {
    top: 0,
    left: 0,
  });

  const dispatch = useDispatch();

  const isPinVisible = useSelector(
    (state: AppState) =>
      shouldShowResolvedSelector(state) ||
      !commentThread?.resolvedState?.active,
  );

  const isCommentThreadVisible = useSelector(
    (state: AppState) =>
      state.ui.comments.visibleCommentThreadId === commentThreadId,
  );

  const handlePinClick = () => {
    if (!commentThread?.isViewed) {
      dispatch(markThreadAsReadRequest(commentThreadId));
    }
  };

  useEffect(() => {
    if (focused) {
      focusThread(commentThreadId);
      // set comment thread visible after scrollIntoView is complete
      setTimeout(() => {
        dispatch(setVisibleThread(commentThreadId));
      });
    }
  }, [focused]);

  if (!commentThread) return null;

  return isPinVisible ? (
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
      <Popover2
        autoFocus={false}
        boundary={Container as HTMLDivElement}
        canEscapeKeyClose
        content={
          <CommentThread
            commentThread={commentThread}
            inline
            isOpen={!!isCommentThreadVisible}
          />
        }
        enforceFocus={false}
        hasBackdrop
        // isOpen is controlled so that newly created threads are set to be visible
        isOpen={!!isCommentThreadVisible}
        minimal
        modifiers={modifiers}
        onInteraction={(nextOpenState: boolean) => {
          if (nextOpenState) {
            dispatch(setVisibleThread(commentThreadId));
          } else {
            dispatch(resetVisibleThread(commentThreadId));
          }
        }}
        placement={"right-start"}
        popoverClassName="comment-thread"
        portalClassName="inline-comment-thread"
      >
        <Pin
          commentThreadId={commentThreadId}
          onClick={handlePinClick}
          sequenceId={commentThread.sequenceId}
          unread={!commentThread.isViewed || isCommentThreadVisible}
        />
      </Popover2>
    </CommentTriggerContainer>
  ) : null;
}

export default InlineCommentPin;
