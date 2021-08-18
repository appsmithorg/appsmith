import React, { useRef, useState } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import {
  createUnpublishedCommentThreadRequest,
  updateCommentThreadEvent,
} from "actions/commentActions";
import commentIcon from "assets/icons/comments/commentCursor.svg";
import { getOffsetPos } from "comments/utils";
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
  const [commentThreadId, setCommentThreadId] = useState<string>("");
  const [isDropped, setIsDropped] = useState(false);
  const [, dropRef] = useDrop({
    accept: [DraggableCommentsItems.INLINE_COMMENT_PIN],
    collect: () => ({}),
    drop: (item, monitor) => {
      const { commentThreadId } = monitor.getItem();
      setCommentThreadId(commentThreadId);
      setIsDropped(monitor.isOver());
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
    if (containerRef.current) {
      const position = getOffsetPos(e, containerRef.current);
      if (isDropped && !!commentThreadId) {
        dispatch(
          updateCommentThreadEvent({
            id: commentThreadId,
            position,
            refId,
            widgetType,
          }),
        );
        setCommentThreadId("");
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
    }
  };
  dropRef(containerRef);
  return (
    <DndProvider backend={HTML5Backend}>
      <Container
        data-cy="overlay-comments-wrapper"
        isCommentMode={isCommentMode}
        onClick={clickHandler}
        ref={isCommentMode ? containerRef : null}
      >
        {children}
        {isCommentMode && <Comments refId={refId} />}
      </Container>
    </DndProvider>
  );
}

export default OverlayCommentsWrapper;
