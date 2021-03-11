import React from "react";
import { useSelector } from "react-redux";
import styled, { withTheme } from "styled-components";
import InlineCommentThreadContainer from "./InlineCommentThreadContainer";
import Icon, { IconSize } from "components/ads/Icon";
import { Popover, Position } from "@blueprintjs/core";
import { get } from "lodash";
import { commentThreadsSelector } from "./selectors";
import { Theme } from "constants/DefaultTheme";

const CommentTriggerContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${(props) => props.top}%;
  left: ${(props) => props.left}%;
`;

const InlineCommentPin = withTheme(
  ({ commentThreadId, theme }: { commentThreadId: string; theme: Theme }) => {
    const commentThread = useSelector(commentThreadsSelector(commentThreadId));
    const { top, left } = get(commentThread, "meta.position", {
      top: 0,
      left: 0,
    });

    return (
      <CommentTriggerContainer
        top={top}
        left={left}
        onClick={(e: any) => {
          // capture clicks so that create new thread is not triggered
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Popover
          minimal
          position={Position.BOTTOM_RIGHT}
          boundary="viewport"
          popoverClassName="comment-thread"
        >
          <Icon
            name="pin"
            fillColor={theme.colors.comments.pin}
            size={IconSize.XXL}
          />
          <InlineCommentThreadContainer commentThread={commentThread} />
        </Popover>
      </CommentTriggerContainer>
    );
  },
);

export default InlineCommentPin;
