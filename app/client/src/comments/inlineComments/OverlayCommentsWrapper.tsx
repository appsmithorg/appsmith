import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";
import commentIcon from "assets/icons/comments/commentCursor.svg";
import { getOffsetPos } from "comments/utils";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";
import { TourType } from "entities/Tour";
import { WidgetType } from "constants/WidgetConstants";
import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "comments/tour/commentsTourSteps";

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
      isCommentMode={isCommentMode}
      onClick={clickHandler}
      ref={isCommentMode ? containerRef : null}
    >
      {children}
      {isCommentMode && <Comments refId={refId} />}
    </Container>
  );
}

export default OverlayCommentsWrapper;
