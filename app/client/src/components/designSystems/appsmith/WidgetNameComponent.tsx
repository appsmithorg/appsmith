import React, { useContext } from "react";
import styled from "styled-components";
import { FocusContext } from "pages/Editor/CanvasContexts";
import { DraggableComponentContext } from "components/editorComponents/DraggableComponent";
const PositionStyle = styled.div<{ selected?: boolean }>`
  position: absolute;
  top: -${props => props.theme.spaces[10]}px;
  left: ${props => props.theme.spaces[6] * 2}px;
  font-size: ${props => props.theme.fontSizes[3]}px;
  font-weight: ${props => props.theme.fontWeights[2]};
  text-align: left;
  width: 100%;
  z-index: 0;
  display: inline-block;
  & pre {
    display: inline;
    padding: 5px;
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
  const { focusedWidget, selectedWidget } = useContext(FocusContext);
  const { isDragging } = useContext(DraggableComponentContext);

  return (focusedWidget === props.widgetId ||
    selectedWidget === props.widgetId) &&
    !isDragging ? (
    <PositionStyle selected={selectedWidget === props.widgetId}>
      <pre>{props.widgetName}</pre>
    </PositionStyle>
  ) : null;
};

export default WidgetNameComponent;
