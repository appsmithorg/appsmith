import { ComponentProps } from "./BaseComponent";
import { ContainerOrientation } from "../constants/WidgetConstants";
import styled from "../constants/DefaultTheme";
import React from "react";
// TODO(abhinav): position absolute may not be required.
// Basically, Container comes up in all views, while DraggableCompnent comes only in Canvas mode.

export const Container = styled("div")<ContainerProps>`
  display: flex;
  flex-direction: ${props => {
    return props.orientation === "HORIZONTAL" ? "row" : "column";
  }};
  background: ${props => props.style.backgroundColor};
  color: ${props => props.theme.colors.primary};
  position: ${props => {
    return props.style.positionType === "ABSOLUTE" ? "absolute" : "relative";
  }};
  left: ${props => {
    return props.style.positionType !== "ABSOLUTE"
      ? undefined
      : props.style.xPosition + props.style.xPositionUnit;
  }};
  top: ${props => {
    return props.style.positionType !== "ABSOLUTE"
      ? undefined
      : props.style.yPosition + props.style.yPositionUnit;
  }};
`;

const ContainerComponent = (props: ContainerProps) => {
  return <Container {...props}>{props.children}</Container>;
};

export interface ContainerProps extends ComponentProps {
  children?: JSX.Element[] | JSX.Element;
  orientation?: ContainerOrientation;
}

export default ContainerComponent;
