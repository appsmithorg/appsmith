import { ComponentProps } from "./BaseComponent";
import { ContainerOrientation } from "../constants/WidgetConstants";
import styled from "../constants/DefaultTheme";
import React, { createContext, Context, useRef } from "react";

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
  height: 100%;
  left: 0;
  top: 0;
  width: 100%;
  padding: ${props => props.theme.spaces[8]}px ${props =>
  props.theme.spaces[1]}px ${props => props.theme.spaces[1]}px;
  &:after {
    content: "${props => props.widgetName}";
    position: absolute;
    left: ${props => props.theme.spaces[1]}px;
    top: ${props => props.theme.spaces[1]}px;
    font-size: ${props => props.theme.fontSizes[2]}px;
    color: ${props => props.theme.colors.containerBorder};
    text-align: left;
    width: 100%;
  }
`;

export const ParentBoundsContext: Context<{
  boundingParent?: React.RefObject<HTMLDivElement>;
}> = createContext({});

const ContainerComponent = (props: ContainerProps) => {
  const container = useRef(null);

  return (
    <ParentBoundsContext.Provider value={{ boundingParent: container }}>
      <Container ref={container} {...props}>
        {props.children}
      </Container>
    </ParentBoundsContext.Provider>
  );
};

export interface ContainerProps extends ComponentProps {
  children?: JSX.Element[] | JSX.Element;
  orientation?: ContainerOrientation;
  isRoot?: boolean;
}

export default ContainerComponent;
