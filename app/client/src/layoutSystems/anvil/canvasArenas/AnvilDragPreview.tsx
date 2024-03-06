import { useSelector } from "react-redux";
import { useCanvasActivationStates } from "./hooks/mainCanvas/useCanvasActivationStates";
import { getWidgetCards } from "selectors/editorSelectors";
import { WidgetCardComponent } from "pages/Editor/WidgetCard";
import type { Ref } from "react";
import React, { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { WidgetCardProps } from "widgets/BaseWidget";
import { AnvilCanvasZIndex } from "./hooks/mainCanvas/useCanvasActivation";
import styled from "styled-components";

const StyledWidgetCardPreviewWrapper = styled.div`
  position: absolute;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0px 4px 4px 0px #00000040;
  pointer-events: none;
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

const WidgetCardPreview = forwardRef(
  (
    {
      cardProps,
      draggedWidgetCount,
    }: { cardProps: WidgetCardProps; draggedWidgetCount: number },
    ref: Ref<HTMLDivElement>,
  ) => {
    return (
      <StyledWidgetCardPreviewWrapper ref={ref}>
        {draggedWidgetCount > 1 && (
          <StyledDraggedWidgetCount>
            {draggedWidgetCount}
          </StyledDraggedWidgetCount>
        )}
        <WidgetCardComponent details={cardProps} />
      </StyledWidgetCardPreviewWrapper>
    );
  },
);

export const AnvilDragPreview = () => {
  const { dragDetails, draggedBlocks, isDragging, isNewWidget } =
    useCanvasActivationStates();
  const cards = useSelector(getWidgetCards);

  const widgetType = isNewWidget
    ? dragDetails.newWidget.type
    : dragDetails.draggingGroupCenter?.widgetType || "";
  const draggedWidgetCount = draggedBlocks.length;
  const cardProps = cards.find((card) => card.type === widgetType);
  const dragPreviewRef = React.useRef<HTMLDivElement>(null);
  const repositionDragPreview = (e: MouseEvent) => {
    if (isDragging && dragPreviewRef.current) {
      dragPreviewRef.current.style.left = `${
        e.clientX - dragPreviewRef.current.clientWidth / 2
      }px`;
      const bufferDistanceBetweenPreviewAndCursor = 10;
      dragPreviewRef.current.style.top = `${
        e.clientY -
        dragPreviewRef.current.clientHeight -
        bufferDistanceBetweenPreviewAndCursor
      }px`;
      if (dragPreviewRef.current.style.zIndex !== AnvilCanvasZIndex.activated) {
        dragPreviewRef.current.style.zIndex = AnvilCanvasZIndex.activated;
      }
    }
  };
  useEffect(() => {
    if (isDragging) {
      document?.addEventListener("mousemove", repositionDragPreview);
    }
    return () => {
      if (isDragging) {
        document?.removeEventListener("mousemove", repositionDragPreview);
      }
    };
  }, [isDragging]);
  const showDragPreview = isDragging && !!cardProps;
  return showDragPreview
    ? createPortal(
        <WidgetCardPreview
          cardProps={cardProps}
          draggedWidgetCount={draggedWidgetCount}
          ref={dragPreviewRef}
        />,
        document.body,
      )
    : null;
};
