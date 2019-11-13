import React, { useContext } from "react";
import styled from "styled-components";
import { FocusContext } from "pages/Editor/Canvas";
import { DraggableComponentContext } from "components/editorComponents/DraggableComponent";

const PositionStyle = styled.div`
  position: absolute;
  top: -${props => props.theme.spaces[10]}px;
  left: ${props => props.theme.spaces[6]}px;
  font-size: ${props => props.theme.fontSizes[2]}px;
  color: ${props => props.theme.colors.containerBorder};
  text-align: left;
  width: 100%;
  z-index: 1;
`;

type WidgetNameComponentProps = {
  widgetName?: string;
  widgetId: string;
};

export const WidgetNameComponent = (props: WidgetNameComponentProps) => {
  const { isFocused } = useContext(FocusContext);
  const { isDragging } = useContext(DraggableComponentContext);

  return isFocused === props.widgetId && !isDragging ? (
    <PositionStyle>{props.widgetName}</PositionStyle>
  ) : null;
};

export default WidgetNameComponent;
