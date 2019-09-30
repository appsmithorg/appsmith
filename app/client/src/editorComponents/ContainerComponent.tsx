import { ComponentProps } from "./BaseComponent";
import { ContainerOrientation } from "../constants/WidgetConstants";
import styled from "../constants/DefaultTheme";
import React from "react";

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
  align-items: stretch;
`;

const ContainerComponent = (props: ContainerProps) => {
  return <Container {...props}>{props.children}</Container>;
};

export interface ContainerProps extends ComponentProps {
  children?: JSX.Element[] | JSX.Element;
  orientation?: ContainerOrientation;
}

export default ContainerComponent;
