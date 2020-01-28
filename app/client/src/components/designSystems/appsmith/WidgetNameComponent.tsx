import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { AppState } from "reducers";

const PositionStyle = styled.div<{ selected?: boolean }>`
  position: absolute;
  top: -${props => props.theme.spaces[7]}px;
  left: ${props => props.theme.spaces[6]}px;
  font-size: ${props => props.theme.fontSizes[2]}px;
  font-weight: ${props => props.theme.fontWeights[2]};
  text-align: left;
  width: 100%;
  z-index: 0;
  display: inline-block;
  & pre {
    display: inline;
    padding: 3px;
    background: ${props =>
      props.selected
        ? props.theme.colors.widgetBorder
        : props.theme.colors.widgetSecondaryBorder};
  }
`;

type WidgetNameComponentProps = {
  widgetName?: string;
  widgetId: string;
};

export const WidgetNameComponent = (props: WidgetNameComponentProps) => {
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.editor.selectedWidget,
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.editor.focusedWidget,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const showWidgetName =
    (focusedWidget === props.widgetId || selectedWidget === props.widgetId) &&
    !isDragging &&
    !isResizing;
  return showWidgetName ? (
    <PositionStyle selected={selectedWidget === props.widgetId}>
      <pre>{props.widgetName}</pre>
    </PositionStyle>
  ) : null;
};

export default WidgetNameComponent;
