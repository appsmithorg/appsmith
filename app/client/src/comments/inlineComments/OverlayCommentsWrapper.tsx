import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";
import commentIcon from "assets/icons/comments/commentCursor.png";
import { getOffsetPos } from "comments/utils";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";
import { TourType } from "entities/Tour";

type Props = {
  children: React.ReactNode;
  refId: string;
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  cursor: url("${commentIcon}") 25 20 , auto;
`;

/**
 * 1. Renders inline comment threads down the tree
 * 2. Calculates pin offset while creating a new comment
 */
function OverlayCommentsWrapper({ children, refId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommentMode = useSelector(commentModeSelector);
  const dispatch = useDispatch();

  const proceedToNextTourStep = useProceedToNextTourStep(
    TourType.COMMENTS_TOUR,
    1,
  );

  // create new unpublished thread
  const clickHandler = (e: any) => {
    proceedToNextTourStep();
    e.persist();
    if (containerRef.current) {
      const position = getOffsetPos(e, containerRef.current);
      if (!isCommentMode) return;
      dispatch(
        createUnpublishedCommentThreadRequest({
          refId,
          position,
        }),
      );
    }
  };

  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (!isCommentMode) return <>{children}</>;

  return (
    <Container
      data-cy="overlay-comments-wrapper"
      onClick={clickHandler}
      ref={containerRef}
    >
      {children}
      <Comments refId={refId} />
    </Container>
  );
}

export default OverlayCommentsWrapper;
