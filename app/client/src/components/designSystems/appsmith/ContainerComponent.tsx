import React, { forwardRef, Ref, ReactNode } from "react";
import styled from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";

const StyledContainerComponent = styled.div<ContainerComponentProps>`
  ${props =>
    props.containerStyle !== "none"
      ? `
  border: none;
  border-radius: ${
    props.containerStyle === "card" || props.containerStyle === "rounded-border"
      ? props.theme.radii[1]
      : 0
  }px;`
      : ""}
  height: 100%;
  width: 100%;
  background: ${props =>
    props.isMainContainer ? "none" : props.backgroundColor};
  box-shadow: ${props =>
    props.isMainContainer
      ? "none"
      : "0 1px 1px 0 rgba(60,75,100,.14),0 2px 1px -1px rgba(60,75,100,.12),0 1px 3px 0 rgba(60,75,100,.2)"};
  position: relative;
  ${props => (!props.isVisible ? invisible : "")};
}`;

/* eslint-disable react/display-name */
const ContainerComponent = forwardRef(
  (props: ContainerComponentProps, ref: Ref<HTMLDivElement>) => {
    return (
      <StyledContainerComponent {...props} ref={ref}>
        {props.children}
      </StyledContainerComponent>
    );
  },
);

ContainerComponent.defaultProps = {
  containerStyle: "card",
  backgroundColor: "white",
};

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps extends ComponentProps {
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  className?: string;
  backgroundColor?: Color;
  isMainContainer: boolean;
}

export default ContainerComponent;
