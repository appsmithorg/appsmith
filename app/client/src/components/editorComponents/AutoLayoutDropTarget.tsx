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

const StyledDiv = styled.div<{ $isMainContainer: boolean }>`
  position: relative;
  z-index: 1;
  min-height: ${(props) =>
    // TODO(aswathkk): Find some ways to not hardcode this
    props.$isMainContainer ? "calc(100vh - 2rem - 40px - 37px)" : undefined};
`;

export function AutoLayoutDropTarget(props: AutoLayoutDropTargetProps) {
  const isDraggingInCurrentCanvas = useSelector(
    isCurrentCanvasDragging(props.widgetId),
  );
  const isDragging = useSelector(getIsDragging);

  return (
    <StyledDiv $isMainContainer={props.widgetId === MAIN_CONTAINER_WIDGET_ID}>
      {props.children}
      {isDragging && isDraggingInCurrentCanvas && (
        <div style={{ height: "10px" }} />
      )}
    </StyledDiv>
  );
}
