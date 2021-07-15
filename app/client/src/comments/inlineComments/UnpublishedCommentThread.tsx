import React from "react";
import { Position } from "@blueprintjs/core";
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

import { getPosition, getShouldPositionAbsolutely } from "comments/utils";
import { Popover2 } from "@blueprintjs/popover2";

const Container = document.getElementById("root");

const CommentTriggerContainer = styled.div<{
  top: number;
  left: number;
  leftPercent: number;
  topPercent: number;
  positionAbsolutely: boolean;
}>`
  position: absolute;
  ${(props) => getPosition(props)}

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
  const dispatch = useDispatch();
  const onClosing = () => {
    dispatch(removeUnpublishedCommentThreads());
  };

  const createCommentThread = (text: RawDraftContentState) => {
    dispatch(createCommentThreadAction({ commentBody: text, commentThread }));
  };

  const positionAbsolutely = getShouldPositionAbsolutely(commentThread);

  console.log(commentThread, "commentThread");

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
      <CommentTriggerContainer
        left={left}
        leftPercent={leftPercent}
        positionAbsolutely={positionAbsolutely}
        top={top}
        topPercent={topPercent}
      >
        <Popover2
          autoFocus={false}
          boundary={Container as HTMLDivElement}
          canEscapeKeyClose
          content={
            <ThreadContainer tabIndex={0}>
              <AddCommentInput
                onCancel={onClosing}
                onSave={createCommentThread}
              />
            </ThreadContainer>
          }
          enforceFocus={false}
          hasBackdrop
          isOpen
          minimal
          modifiers={{
            offset: {
              enabled: true,
              options: {
                offset: [-8, 10],
              },
            },
          }}
          onInteraction={(nextOpenState) => {
            if (!nextOpenState) {
              onClosing();
            }
          }}
          placement={"right-start"}
          popoverClassName="comment-thread"
          portalClassName="inline-comment-thread"
          position={Position.RIGHT_TOP}
        >
          <Icon keepColors name="unread-pin" />
        </Popover2>
      </CommentTriggerContainer>
    </div>
  );
}

export default UnpublishedCommentThread;
