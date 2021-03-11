import React from "react";
import { Popover, Position } from "@blueprintjs/core";
import AddCommentInput from "./AddCommentInput";
import {
  ThreadContainer,
  ThreadHeaderTitle,
  ThreadHeader,
} from "./StyledComponents";
import { useDispatch } from "react-redux";
import styled, { withTheme } from "styled-components";
import { get } from "lodash";
import {
  createCommentThreadRequest as createCommentThreadAction,
  removeUnpublishedCommentThreads,
} from "actions/commentActions";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";

const CommentTriggerContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${(props) => props.top}%;
  left: ${(props) => props.left}%;
`;

const UnpublishedCommentThread = withTheme(
  ({ theme, commentThread }: { commentThread: any; theme: Theme }) => {
    const { top, left } = get(commentThread, "meta.position", {
      top: 0,
      left: 0,
    });
    const dispatch = useDispatch();
    const onClosing = () => {
      dispatch(removeUnpublishedCommentThreads());
    };

    const createCommentThread = (text: string) => {
      dispatch(createCommentThreadAction({ commentBody: text, commentThread }));
    };

    return (
      <div
        key={`${top}-${left}`}
        onClick={(e: any) => {
          // capture clicks so that create new thread is not triggered
          // todo: should be enabled in comment mode only
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <CommentTriggerContainer top={top} left={left}>
          <Popover
            popoverClassName="comment-thread"
            captureDismiss
            isOpen={true}
            minimal
            position={Position.BOTTOM_RIGHT}
            boundary="viewport"
            onClosing={onClosing}
            onInteraction={(nextOpenState) => {
              if (!nextOpenState) {
                onClosing();
              }
            }}
          >
            <Icon
              name="pin"
              fillColor={theme.colors.comments.pin}
              size={IconSize.XXL}
            />
            <ThreadContainer>
              <ThreadHeader>
                <ThreadHeaderTitle>Add a Comment</ThreadHeaderTitle>
              </ThreadHeader>
              <AddCommentInput onSave={createCommentThread} />
            </ThreadContainer>
          </Popover>
        </CommentTriggerContainer>
      </div>
    );
  },
);

export default UnpublishedCommentThread;
