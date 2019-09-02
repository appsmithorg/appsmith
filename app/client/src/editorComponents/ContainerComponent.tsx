import { IComponentProps } from "./BaseComponent";
import { ContainerOrientation } from "../constants/WidgetConstants";
import styled from "../constants/DefaultTheme";
import { useDrop } from "react-dnd"
import { WidgetTypes } from "../constants/WidgetConstants"
import { DraggableWidget } from "../widgets/BaseWidget"
import React from "react";

export const Container = styled("div")<ContainerProps>`
  display: flex;
  flex-direction: ${props => {
    return props.orientation === "HORIZONTAL" ? "row" : "column"
  }};
  background: ${props => props.style.backgroundColor};
  color: ${props => props.theme.primaryColor};
  position: ${props => {
    return props.style.positionType === "ABSOLUTE" ? "absolute" : "relative"
  }};
  left: ${props => {
    return props.style.positionType !== "ABSOLUTE" ? undefined : props.style.xPosition + props.style.xPositionUnit
  }};
  top: ${props => {
    return props.style.positionType !== "ABSOLUTE" ? undefined : props.style.yPosition + props.style.yPositionUnit
  }};
`;
const ContainerComponent = (props: ContainerProps) => {
  const addWidgetFn = props.addWidget;
  const [, drop] = useDrop({
    accept: Object.values(WidgetTypes),
    drop(item: DraggableWidget, monitor) {
      if (addWidgetFn && monitor.isOver({shallow: true})){
        addWidgetFn(item.type);
      }
      return undefined
    },
  })
  return <Container ref={drop} {...props}>{props.children}</Container> 
}

export interface ContainerProps extends IComponentProps {
  children?: JSX.Element[] | JSX.Element;
  orientation?: ContainerOrientation;
  addWidget?: Function;
}

export default ContainerComponent
