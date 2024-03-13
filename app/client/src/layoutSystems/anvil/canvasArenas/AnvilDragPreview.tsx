import { useSelector } from "react-redux";
import { useCanvasActivationStates } from "./hooks/mainCanvas/useCanvasActivationStates";
import { getWidgetCards } from "selectors/editorSelectors";
import { WidgetCardComponent } from "pages/Editor/WidgetCard";
import React, { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import type { WidgetCardProps } from "widgets/BaseWidget";
import { AnvilCanvasZIndex } from "./hooks/mainCanvas/useCanvasActivation";
import styled from "styled-components";

const StyledWidgetCardPreviewWrapper = styled.div`
  position: absolute;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0px 4px 4px 0px #00000040;
  opacity: 80%;
  pointer-events: none;
  /* will be enabled by AnvilDragPreview as required */
  display: none;
`;

const StyledDraggedWidgetCount = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 3px;
  background: #f6f3ff;
  position: absolute;
  color: #390a6d;
  z-index: 1;
  top: -12px;
  text-align: center;
  left: calc(100% - 12px);
`;
const BufferDistanceBetweenPreviewAndCursor = 10;

const WidgetCardPreview = ({
  cardProps,
  draggedWidgetCount,
}: {
  cardProps: WidgetCardProps;
  draggedWidgetCount: number;
}) => {
  const { isDragging } = useCanvasActivationStates();
  const dragPreviewRef = React.useRef<HTMLDivElement>(null);
  const repositionDragPreview = useCallback(
    (e: MouseEvent) => {
      if (isDragging && dragPreviewRef.current) {
        dragPreviewRef.current.style.left = `${
          e.clientX - dragPreviewRef.current.clientWidth / 2
        }px`;
        dragPreviewRef.current.style.top = `${
          e.clientY -
          dragPreviewRef.current.clientHeight -
          BufferDistanceBetweenPreviewAndCursor
        }px`;
        if (
          dragPreviewRef.current.style.zIndex !== AnvilCanvasZIndex.activated
        ) {
          dragPreviewRef.current.style.zIndex = AnvilCanvasZIndex.activated;
          dragPreviewRef.current.style.display = "block";
        }
      }
    },
    [isDragging],
  );
  useEffect(() => {
    if (isDragging) {
      document?.addEventListener("mousemove", repositionDragPreview);
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.zIndex = "-1";
        dragPreviewRef.current.style.display = "none";
      }
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
      <WidgetCardComponent details={cardProps} />
    </StyledWidgetCardPreviewWrapper>
  );
};

export const AnvilDragPreview = () => {
  const { dragDetails, draggedBlocks, isDragging, isNewWidget } =
    useCanvasActivationStates();
  const cards = useSelector(getWidgetCards);
  const widgetType = isNewWidget
    ? dragDetails.newWidget.type
    : dragDetails.draggingGroupCenter?.widgetType || "";
  const draggedWidgetCount = draggedBlocks.length;
  const cardProps = cards.find((card) => card.type === widgetType);
  const showDragPreview = isDragging && !!cardProps;
  return showDragPreview
    ? createPortal(
        <WidgetCardPreview
          cardProps={cardProps}
          draggedWidgetCount={draggedWidgetCount}
        />,
        document.body,
      )
    : null;
};
