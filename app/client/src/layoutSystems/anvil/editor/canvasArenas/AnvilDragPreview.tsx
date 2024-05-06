import { useSelector } from "react-redux";
import { getWidgetCards } from "selectors/editorSelectors";
import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { WidgetCardComponent } from "pages/Editor/widgetSidebar/WidgetCard";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import type { DraggedWidget } from "layoutSystems/anvil/utils/anvilTypes";

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

const WidgetCardPreview = ({
  cardProps,
  draggedWidgetCount,
  isDragging,
}: {
  isDragging: boolean;
  cardProps: WidgetCardProps;
  draggedWidgetCount: number;
}) => {
  const dragPreviewRef = React.useRef<HTMLDivElement>(null);
  const initiatePositionStylesOfDragPreview = useRef(true);
  const repositionDragPreview = useCallback(
    (e: MouseEvent) => {
      if (isDragging && dragPreviewRef.current) {
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
      <WidgetCardComponent details={cardProps} />
    </StyledWidgetCardPreviewWrapper>
  );
};

export const AnvilDragPreview = ({
  dragDetails,
  draggedBlocks,
  isDragging,
  isNewWidget,
}: {
  dragDetails: DragDetails;
  draggedBlocks: DraggedWidget[];
  isDragging: boolean;
  isNewWidget: boolean;
}) => {
  const cards = useSelector(getWidgetCards);
  const widgetType = isNewWidget
    ? dragDetails?.newWidget?.type
    : dragDetails?.draggingGroupCenter?.widgetType || "";
  const cardProps = cards.find((card) => card.type === widgetType);
  const showDragPreview = isDragging && !!cardProps;
  const draggedWidgetCount = draggedBlocks.length;
  return showDragPreview
    ? createPortal(
        <WidgetCardPreview
          cardProps={cardProps}
          draggedWidgetCount={draggedWidgetCount}
          isDragging={isDragging}
        />,
        document.body,
      )
    : null;
};
