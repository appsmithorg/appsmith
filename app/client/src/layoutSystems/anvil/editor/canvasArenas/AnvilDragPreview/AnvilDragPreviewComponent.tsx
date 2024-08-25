import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { Wrapper } from "pages/Editor/widgetSidebar/WidgetCard";
import { Text } from "@appsmith/ads";

const StyledWidgetCardPreviewWrapper = styled.div`
  position: absolute;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0px 4px 4px 0px #00000040;
  opacity: 80%;
  pointer-events: none;
  /* will be enabled by AnvilDragPreview as required */
  display: none;
  z-index: -1;
`;

const StyledDraggedWidgetCount = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 3px;
  background: var(--anvil-multiple-drag-count-bg);
  position: absolute;
  color: var(--anvil-multiple-drag-count-text);
  z-index: 1;
  top: -12px;
  text-align: center;
  left: calc(100% - 12px);
`;
const BufferDistanceBetweenPreviewAndCursor = 10;

const ThumbnailWrapper = styled.div<{ height: number; width: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;
const THUMBNAIL_HEIGHT = 76;
const THUMBNAIL_WIDTH = 72;
const AnvilDragPreviewWidgetCardComponent = ({
  displayName,
  ThumbnailCmp,
}: {
  displayName: string;
  ThumbnailCmp?: React.FC;
}) => {
  return (
    <Wrapper>
      <ThumbnailWrapper height={THUMBNAIL_HEIGHT} width={THUMBNAIL_WIDTH}>
        {ThumbnailCmp && <ThumbnailCmp />}
      </ThumbnailWrapper>
      <Text kind="body-s">{displayName}</Text>
    </Wrapper>
  );
};

export const AnvilDragPreviewComponent = ({
  displayName,
  draggedWidgetCount,
  isDragging,
  ThumbnailCmp,
}: {
  isDragging: boolean;
  displayName: string;
  ThumbnailCmp?: React.FC;
  draggedWidgetCount: number;
}) => {
  const dragPreviewRef = React.useRef<HTMLDivElement>(null);
  const initiatePositionStylesOfDragPreview = useRef(true);
  const repositionDragPreview = useCallback(
    (e: MouseEvent) => {
      const isOutOfWindow =
        e.clientX < 0 ||
        e.clientY < 0 ||
        e.clientY > window.innerHeight ||
        e.clientX > window.innerWidth;
      if (isDragging && dragPreviewRef.current && !isOutOfWindow) {
        if (initiatePositionStylesOfDragPreview.current) {
          dragPreviewRef.current.style.zIndex =
            " calc(var(--on-canvas-ui-zindex) + 2)";
          // hiding the drag preview to and flipping display so that
          // the drag preview is not visible but its height and width are available
          // to calculate the position of the drag preview
          dragPreviewRef.current.style.visibility = "hidden";
          dragPreviewRef.current.style.display = "block";
        }
        dragPreviewRef.current.style.left = `${
          e.clientX - dragPreviewRef.current.clientWidth / 2
        }px`;
        dragPreviewRef.current.style.top = `${
          e.clientY -
          dragPreviewRef.current.clientHeight -
          BufferDistanceBetweenPreviewAndCursor
        }px`;
        if (initiatePositionStylesOfDragPreview.current) {
          dragPreviewRef.current.style.visibility = "visible";
          initiatePositionStylesOfDragPreview.current = false;
        }
      }
    },
    [isDragging],
  );
  useEffect(() => {
    if (isDragging) {
      initiatePositionStylesOfDragPreview.current = true;
      document?.addEventListener("mousemove", repositionDragPreview);
    } else {
      initiatePositionStylesOfDragPreview.current = false;
    }
    return () => {
      if (isDragging) {
        document?.removeEventListener("mousemove", repositionDragPreview);
      }
    };
  }, [isDragging]);
  return (
    <StyledWidgetCardPreviewWrapper ref={dragPreviewRef}>
      {draggedWidgetCount > 1 && (
        <StyledDraggedWidgetCount>
          {draggedWidgetCount}
        </StyledDraggedWidgetCount>
      )}
      <AnvilDragPreviewWidgetCardComponent
        ThumbnailCmp={ThumbnailCmp}
        displayName={displayName}
      />
    </StyledWidgetCardPreviewWrapper>
  );
};
