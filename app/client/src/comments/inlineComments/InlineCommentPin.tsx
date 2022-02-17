import React, { useEffect, useRef } from "react";
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
  setDraggingCommentThread,
} from "actions/commentActions";
import scrollIntoView from "scroll-into-view-if-needed";
import { AppState } from "reducers";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { Popover2 } from "@blueprintjs/popover2";

import { getPosition, getShouldPositionAbsolutely } from "comments/utils";
import history from "utils/history";

const COMMENT_PIN_SIZE = 30;
/**
 * The relavent pixel position is bottom right for the comment cursor
 * instead of the top left for the default arrow cursor
 */
const CommentTriggerContainer = styled.div<{
  top?: number;
  left?: number;
  leftPercent: number;
  topPercent: number;
  positionAbsolutely: boolean;
  xOffset: number;
  yOffset: number;
}>`
  position: fixed;
  ${(props) => getPosition(props)}
  z-index: 1;
`;

const StyledPinContainer = styled.div<{
  isDragging?: boolean | null;
  unread?: boolean;
}>`
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
  cursor: ${(props) => (props.isDragging ? "grabbing" : "pointer")};
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
  const isDragging = useSelector(
    (state: AppState) =>
      state.ui.comments.draggingCommentThreadId === commentThreadId,
  );
  return (
    <StyledPinContainer
      isDragging={isDragging}
      onClick={onClick}
      unread={unread}
    >
      <Icon
        className={`comment-thread-pin-${commentThreadId} t--inline-comment-pin-trigger-${commentThreadId}`}
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

const resetCommentThreadIdInURL = (commentThreadId: string) => {
  if (!window.location.href) return;
  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  if (searchParams.get("commentThreadId") === commentThreadId) {
    searchParams.delete("commentThreadId");

    history.replace({
      ...window.location,
      search: searchParams.toString(),
    });
  }
};

/**
 * Comment pins that toggle comment thread popover visibility on click
 * They position themselves using position absolute based on top and left values (in percent)
 */

type Props = {
  commentThreadId: string;
  focused: boolean;
};

function InlineCommentPin(props: Props) {
  const { commentThreadId, focused } = props;
  const inlineCommentPinRef = useRef<HTMLDivElement>(null);
  const commentThread = useSelector(commentThreadsSelector(commentThreadId));
  const { left, leftPercent, top, topPercent } = get(
    commentThread,
    "position",
    {
      left: 0,
      leftPercent: 0,
      top: 0,
      topPercent: 0,
    },
  );
  // if user has opened a thread, we'll close it
  // as soon as they start to drag the pin
  const shouldHideThread = useSelector(
    (state: AppState) =>
      state.ui.comments.draggingCommentThreadId === commentThreadId,
  );

  const positionAbsolutely = getShouldPositionAbsolutely(commentThread);

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

  const onCommentPinDragStart = (e: any) => {
    e.stopPropagation();
    let offset = null;
    if (inlineCommentPinRef.current) {
      const pinElm = inlineCommentPinRef.current.getBoundingClientRect();
      offset = {
        x: COMMENT_PIN_SIZE - (e.clientX - pinElm.x),
        y: COMMENT_PIN_SIZE - (e.clientY - pinElm.y),
      };
    }
    dispatch(setDraggingCommentThread(commentThreadId, offset));
  };

  if (!commentThread) return null;

  return isPinVisible ? (
    <CommentTriggerContainer
      data-cy="inline-comment-pin"
      draggable
      left={left}
      leftPercent={leftPercent}
      onClick={(e: any) => {
        // capture clicks so that create new thread is not triggered
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragStart={onCommentPinDragStart}
      positionAbsolutely={positionAbsolutely}
      ref={inlineCommentPinRef}
      top={top}
      topPercent={topPercent}
      xOffset={2}
      yOffset={1}
    >
      <Popover2
        autoFocus={false}
        boundary={Container as HTMLDivElement}
        canEscapeKeyClose
        content={
          <CommentThread
            commentThread={commentThread}
            inline
            isOpen={!!isCommentThreadVisible && !shouldHideThread}
          />
        }
        enforceFocus={false}
        // isOpen is controlled so that newly created threads are set to be visible
        isOpen={!!isCommentThreadVisible && !shouldHideThread}
        minimal
        modifiers={modifiers}
        onInteraction={(
          nextOpenState: boolean,
          e?: React.SyntheticEvent<HTMLElement>,
        ) => {
          if (nextOpenState) {
            dispatch(setVisibleThread(commentThreadId));
          } else {
            const shouldPersistComment = e?.type === "mousedown";
            dispatch(resetVisibleThread(commentThreadId, shouldPersistComment));
            resetCommentThreadIdInURL(commentThreadId);
          }
        }}
        placement={"right-start"}
        popoverClassName="comment-thread"
        portalClassName="inline-comment-thread"
      >
        <Pin
          commentThreadId={commentThreadId}
          onClick={handlePinClick}
          sequenceId={commentThread?.sequenceId}
          unread={!commentThread?.isViewed || isCommentThreadVisible}
        />
      </Popover2>
    </CommentTriggerContainer>
  ) : null;
}

export default InlineCommentPin;
