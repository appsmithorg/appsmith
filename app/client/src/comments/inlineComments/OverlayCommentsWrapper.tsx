import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { commentModeSelector } from "selectors/commentsSelectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";
import commentIcon from "assets/icons/comments/commentCursor.png";
import { getOffsetPos } from "comments/utils";

type Props = {
  children: React.ReactNode;
  refId: string;
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
const OverlayCommentsWrapper = ({ children, refId }: Props) => {
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

  if (!isCommentMode) return <>{children}</>;

  return (
    <Container
      ref={containerRef}
      onClick={clickHandler}
      data-cy="overlay-comments-wrapper"
    >
      {children}
      <Comments refId={refId} />
    </Container>
  );
};

export default OverlayCommentsWrapper;
