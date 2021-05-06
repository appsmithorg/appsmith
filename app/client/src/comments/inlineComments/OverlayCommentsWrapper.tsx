import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";
import commentIcon from "assets/icons/ads/commentIcon.png";

type Props = {
  children: React.ReactNode;
  refId: string;
};

/**
 * Returns the offset position relative to the container
 * using the coordinates from the click event
 * @param clickEvent
 * @param containerRef
 */
const getOffsetPos = (
  clickEvent: React.MouseEvent,
  containerRef: HTMLDivElement,
) => {
  const boundingClientRect = containerRef.getBoundingClientRect();
  const containerPosition = {
    left: boundingClientRect.left,
    top: boundingClientRect.top,
  };
  const clickPosition = {
    left: clickEvent.clientX,
    top: clickEvent.clientY,
  };

  const offsetLeft = clickPosition.left - containerPosition.left;
  const offsetTop = clickPosition.top - containerPosition.top;

  const offsetLeftPercent = parseInt(
    `${(offsetLeft / boundingClientRect.width) * 100}`,
  );
  const offsetTopPercent = parseInt(
    `${(offsetTop / boundingClientRect.height) * 100}`,
  );

  return {
    left: offsetLeftPercent,
    top: offsetTopPercent,
  };
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  cursor: -webkit-image-set(url("${commentIcon}") 2x) 11 17, auto;
`;

/**
 * 1. Renders inline comment threads down the tree
 * 2. Calculates pin offset while creating a new comment
 */
function OverlayCommentsWrapper({ children, refId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommentMode = useSelector(commentModeSelector);
  const dispatch = useDispatch();
  // create new unpublished thread
  const clickHandler = (e: any) => {
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
