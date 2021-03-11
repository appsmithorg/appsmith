import React, { useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { isCommentMode as isCommentModeSelector } from "components/ads/Comments/selectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";

type Props = {
  children: React.ReactNode;
  refId: string;
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

const OverlayCommentsWrapper = ({ children, refId }: Props) => {
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

  return (
    <div
      ref={containerRef}
      onClick={clickHandler}
      style={{ width: "100%", height: "100%" }}
    >
      {children}
      <Comments refId={refId} />
    </div>
  );
};

export default OverlayCommentsWrapper;
