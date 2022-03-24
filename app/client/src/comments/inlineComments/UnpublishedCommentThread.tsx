import React from "react";
import AddCommentInput from "./AddCommentInput";
import { ThreadContainer } from "./StyledComponents";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { get } from "lodash";
import {
  createCommentThreadRequest as createCommentThreadAction,
  removeUnpublishedCommentThreads,
  updateUnpublishedThreadDraftComment,
} from "actions/commentActions";
import Icon from "components/ads/Icon";
import { EditorState, RawDraftContentState } from "draft-js";
import { CommentThread } from "entities/Comments/CommentsInterfaces";

import { getPosition, getShouldPositionAbsolutely } from "comments/utils";
import { Popover2 } from "@blueprintjs/popover2";
import { getUnpublishedThreadDraftComment } from "selectors/commentsSelectors";

const Container = document.getElementById("root");

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
  const onClosing = (shouldPersistComment?: boolean) => {
    dispatch(removeUnpublishedCommentThreads(shouldPersistComment));
  };

  const onChange = (editorState: EditorState) => {
    dispatch(updateUnpublishedThreadDraftComment(editorState));
  };

  const createCommentThread = (text: RawDraftContentState) => {
    dispatch(createCommentThreadAction({ commentBody: text, commentThread }));
  };

  const unpublishedThreadDraftComment = useSelector(
    getUnpublishedThreadDraftComment,
  );

  const positionAbsolutely = getShouldPositionAbsolutely(commentThread);

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
        xOffset={2}
        yOffset={1}
      >
        <Popover2
          autoFocus={false}
          boundary={Container as HTMLDivElement}
          canEscapeKeyClose
          content={
            <ThreadContainer tabIndex={0}>
              <AddCommentInput
                initialEditorState={unpublishedThreadDraftComment}
                onCancel={onClosing}
                onChange={onChange}
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
          onInteraction={(
            nextOpenState,
            e?: React.SyntheticEvent<HTMLElement>,
          ) => {
            if (!nextOpenState) {
              const shouldPersistComment = e?.type === "mousedown";
              onClosing(shouldPersistComment);
            }
          }}
          placement={"right-start"}
          popoverClassName="comment-thread"
          portalClassName="inline-comment-thread"
        >
          <Icon keepColors name="unread-pin" />
        </Popover2>
      </CommentTriggerContainer>
    </div>
  );
}

export default UnpublishedCommentThread;
