import React, { useCallback, useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import {
  createUnpublishedCommentThreadRequest,
  dragCommentThread,
  setHasDroppedCommentThread,
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

const stopPropagation = (e: any) => {
  e.stopPropagation();
  e.preventDefault();
};

const preventDefault = (e: any) => {
  e.preventDefault();
};

type Props = {
  children: React.ReactNode;
  refId: string;
  widgetType: WidgetType;
};

const COMMENT_PIN_OFFSET = 15;

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
function OverlayCommentsWrapper(props: Props) {
  const { children, refId, widgetType } = props;

  const updateCommentPinPosition = useCallback(
    (e: any) => {
      if (containerRef.current) {
        const newPosition = getNewDragPos(
          {
            x: e.clientX + COMMENT_PIN_OFFSET,
            y: e.clientY + COMMENT_PIN_OFFSET,
          },
          containerRef.current,
        );
        dispatch(
          dragCommentThread({
            position: newPosition,
            refId,
            widgetType,
          }),
        );
        dispatch(setHasDroppedCommentThread());
        e.stopPropagation();
      }
    },
    [refId, widgetType],
  );

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
    proceedToNextTourStep();
    e.persist();
    e.stopPropagation();
    if (containerRef.current) {
      const position = getOffsetPos(e, containerRef.current);
      dispatch(
        createUnpublishedCommentThreadRequest({
          refId,
          widgetType,
          position,
        }),
      );
    }
  };

  return (
    <Container
      data-cy="overlay-comments-wrapper"
      id={`comment-overlay-wrapper-${refId}`}
      isCommentMode={isCommentMode}
      onClick={clickHandler}
      onDragEnter={stopPropagation}
      onDragLeave={preventDefault}
      onDragOver={preventDefault}
      onDrop={updateCommentPinPosition}
      ref={containerRef}
    >
      {children}
      {isCommentMode && <Comments refId={refId} />}
    </Container>
  );
}

export default OverlayCommentsWrapper;
