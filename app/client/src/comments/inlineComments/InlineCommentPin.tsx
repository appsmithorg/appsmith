import React from "react";
import { useSelector, useDispatch } from "react-redux";
import styled, { withTheme } from "styled-components";
import InlineCommentThreadContainer from "./InlineCommentThreadContainer";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover } from "@blueprintjs/core";
import { get } from "lodash";
import { commentThreadsSelector } from "../../selectors/commentsSelectors";
import { Theme } from "constants/DefaultTheme";
import { setIsCommentThreadVisible as setIsCommentThreadVisibleAction } from "actions/commentActions";

const CommentTriggerContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${(props) => props.top}%;
  left: ${(props) => props.left}%;
  z-index: 1;
`;

/**
 * Comment pins that toggle comment thread popover visibility on click
 * They position themselves using position absolute based on top and left values (in percent)
 */
const InlineCommentPin = withTheme(
  ({ commentThreadId, theme }: { commentThreadId: string; theme: Theme }) => {
    const commentThread = useSelector(commentThreadsSelector(commentThreadId));
    const { top, left } = get(commentThread, "position", {
      top: 0,
      left: 0,
    });

    const dispatch = useDispatch();
    const setIsCommentThreadVisible = (isVisible: boolean) =>
      dispatch(
        setIsCommentThreadVisibleAction({
          commentThreadId,
          isVisible,
        }),
      );

    return (
      <CommentTriggerContainer
        top={top}
        left={left}
        onClick={(e: any) => {
          // capture clicks so that create new thread is not triggered
          e.preventDefault();
          e.stopPropagation();
        }}
        data-cy="inline-comment-pin"
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
        >
          <Icon
            name="pin"
            fillColor={theme.colors.comments.pin}
            size={IconSize.XXL}
            data-cy={`t--inline-comment-pin-trigger-${commentThreadId}`}
          />
          <InlineCommentThreadContainer
            isOpen={!!commentThread.isVisible}
            commentThread={commentThread}
          />
        </Popover>
      </CommentTriggerContainer>
    );
  },
);

export default InlineCommentPin;
