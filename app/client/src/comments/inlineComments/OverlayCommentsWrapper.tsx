import React, { useRef, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import {
  createUnpublishedCommentThreadRequest,
  dragCommentThreadEvent,
} from "actions/commentActions";
import commentIcon from "assets/icons/comments/commentCursor.svg";
import { getNewDragPos, getOffsetPos } from "comments/utils";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";
import { TourType } from "entities/Tour";
import { WidgetType } from "constants/WidgetConstants";
import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "comments/tour/commentsTourSteps";
import { DndProvider, useDrop } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import { DraggableCommentsItems } from "./InlineCommentPin";
import { getCurrentApplicationId } from "../../selectors/editorSelectors";

type Props = {
  children: React.ReactNode;
  refId: string;
  widgetType: WidgetType;
};

const Container = styled.div<{ isCommentMode: boolean }>`
  width: 100%;
  height: 100%;
  position: relative;
  ${(props) =>
    props.isCommentMode && `cursor: url("${commentIcon}") 25 20 , auto;`}
`;

/**
 * 1. Renders inline comment threads down the tree
 * 2. Calculates pin offset while creating a new comment
 */
function OverlayCommentsWrapper({ children, refId, widgetType }: Props) {
  const [isDropped, setIsDropped] = useState(false);
  const applicationId = useSelector(getCurrentApplicationId);
  const [hasDroppedOnChild, setHasDroppedOnChild] = useState(false);
  const [, dropRef] = useDrop({
    accept: [DraggableCommentsItems.INLINE_COMMENT_PIN],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    drop: (item, monitor) => {
      setIsDropped(monitor.isOver());
      const didDrop = monitor.didDrop();
      setHasDroppedOnChild(didDrop);
      if (didDrop) return;

      const { commentThreadId } = monitor.getItem();
      const absolutePosition = monitor.getClientOffset();
      if (commentThreadId && absolutePosition && containerRef.current) {
        const newPosition = getNewDragPos(
          absolutePosition,
          containerRef.current,
        );
        dispatch(
          dragCommentThreadEvent({
            id: commentThreadId,
            position: newPosition,
            refId,
            widgetType,
            applicationId,
          }),
        );
      }
    },
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommentMode = useSelector(commentModeSelector);
  const dispatch = useDispatch();

  const proceedToNextTourStep = useProceedToNextTourStep({
    [TourType.COMMENTS_TOUR_EDIT_MODE]:
      commentsTourStepsEditModeTypes.CREATE_UNPUBLISHED_COMMENT,
    [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
      commentsTourStepsPublishedModeTypes.CREATE_UNPUBLISHED_COMMENT,
  });

  // create new unpublished thread
  const clickHandler = (e: any) => {
    if (!isCommentMode) return;
    e.persist();
    e.stopPropagation();
    if (containerRef.current && !hasDroppedOnChild) {
      const position = getOffsetPos(e, containerRef.current);
      if (isDropped) {
        setIsDropped(false);
      } else {
        proceedToNextTourStep();
        dispatch(
          createUnpublishedCommentThreadRequest({
            refId,
            widgetType,
            position,
          }),
        );
      }
    } else {
      setHasDroppedOnChild(false);
    }
  };
  dropRef(containerRef);
  return (
    <DndProvider backend={HTML5Backend}>
      <Container
        data-cy="overlay-comments-wrapper"
        id={`comment-overlay-wrapper-${refId}`}
        isCommentMode={isCommentMode}
        onClick={clickHandler}
        ref={containerRef}
      >
        {children}
        {isCommentMode && <Comments refId={refId} />}
      </Container>
    </DndProvider>
  );
}

export default OverlayCommentsWrapper;
