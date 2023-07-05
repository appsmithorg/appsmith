import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { ReactNode } from "react";
import React from "react";
import { useSelector } from "react-redux";
import { isCurrentCanvasDragging } from "selectors/autoLayoutSelectors";
import { getIsDragging } from "selectors/widgetSelectors";
import styled from "styled-components";

type AutoLayoutDropTargetProps = {
  children: ReactNode;
  widgetId: string;
};

const StyledDiv = styled.div<{ $isMainCanvas: boolean }>`
  position: relative;
  z-index: 1;
  min-height: ${(props) =>
    props.$isMainCanvas ? "var(--main-canvas-height)" : undefined};
  height: 100%;
`;

export function AutoLayoutDropTarget(props: AutoLayoutDropTargetProps) {
  const isDraggingInCurrentCanvas = useSelector(
    isCurrentCanvasDragging(props.widgetId),
  );
  const isDragging = useSelector(getIsDragging);
  const isMainCanvas = props.widgetId === MAIN_CONTAINER_WIDGET_ID;

  return (
    <StyledDiv $isMainCanvas={isMainCanvas}>
      {props.children}
      {/* A dummy div which will helps to show the highlights at the bottom of MainCanvas */}
      {isMainCanvas && isDragging && isDraggingInCurrentCanvas && (
        <div style={{ height: "10px" }} />
      )}
    </StyledDiv>
  );
}
