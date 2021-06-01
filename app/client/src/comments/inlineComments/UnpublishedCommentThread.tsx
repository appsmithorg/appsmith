import React from "react";
import { Popover, Position } from "@blueprintjs/core";
import AddCommentInput from "./AddCommentInput";
import { ThreadContainer } from "./StyledComponents";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { get } from "lodash";
import {
  createCommentThreadRequest as createCommentThreadAction,
  removeUnpublishedCommentThreads,
} from "actions/commentActions";
import Icon from "components/ads/Icon";
import { RawDraftContentState } from "draft-js";
import { CommentThread } from "entities/Comments/CommentsInterfaces";

const CommentTriggerContainer = styled.div<{ top: number; left: number }>`
  position: absolute;
  bottom: calc(${(props) => 100 - props.top}% - 2px);
  right: calc(${(props) => 100 - props.left}% - 2px);

  & svg {
    width: 30px;
    height: 30px;
    box-shadow: 0px 8px 10px rgb(0 0 0 / 15%);
    border-radius: 15px;
    overflow: visible;
  }
`;

// TODO look into drying this up using comment thread component
function UnpublishedCommentThread({
  commentThread,
}: {
  commentThread: CommentThread;
}) {
  const { left, top } = get(commentThread, "position", {
    top: 0,
    left: 0,
  });
  const dispatch = useDispatch();
  const onClosing = () => {
    dispatch(removeUnpublishedCommentThreads());
  };

  const createCommentThread = (text: RawDraftContentState) => {
    dispatch(createCommentThreadAction({ commentBody: text, commentThread }));
  };

  return (
    <div
      data-cy="unpublished-comment-thread"
      key={`${top}-${left}`}
      onClick={(e: any) => {
        // capture clicks so that create new thread is not triggered
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <CommentTriggerContainer left={left} top={top}>
        <Popover
          autoFocus
          boundary="viewport"
          canEscapeKeyClose
          hasBackdrop
          isOpen
          minimal
          modifiers={{
            offset: {
              enabled: true,
              offset: "-8, 10",
            },
          }}
          onInteraction={(nextOpenState) => {
            if (!nextOpenState) {
              onClosing();
            }
          }}
          popoverClassName="comment-thread"
          position={Position.RIGHT_TOP}
        >
          <Icon keepColors name="unread-pin" />
          <ThreadContainer tabIndex={0}>
            <AddCommentInput
              onCancel={onClosing}
              onSave={createCommentThread}
            />
          </ThreadContainer>
        </Popover>
      </CommentTriggerContainer>
    </div>
  );
}

export default UnpublishedCommentThread;
