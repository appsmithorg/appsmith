import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { isCommentMode as isCommentModeSelector } from "components/ads/Comments/selectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";

type Props = {
  children: React.ReactNode;
  refId: string;
  widgetType: string;
};

const getOffsetPos = (clickEvent: any, containerRef: any) => {
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

const PreventClicksOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const preventInteractionsBlacklist = [
  "CONTAINER_WIDGET",
  "CANVAS_WIDGET",
  "TABS_WIDGET",
  "FORM_WIDGET",
];

const OverlayCommentsWrapper = ({ children, refId, widgetType }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommentMode = useSelector(isCommentModeSelector);
  const dispatch = useDispatch();
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

  const shouldNotPreventComponentInteraction =
    preventInteractionsBlacklist.indexOf(widgetType) !== -1;

  return (
    <Container ref={containerRef} onClick={clickHandler}>
      {children}
      {/* Prevent clicks to the component in the comment mode */}
      {!shouldNotPreventComponentInteraction && <PreventClicksOverlay />}
      <Comments refId={refId} />
    </Container>
  );
};

export default OverlayCommentsWrapper;
