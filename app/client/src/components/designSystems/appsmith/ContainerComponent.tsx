import React, { forwardRef, Ref, ReactNode } from "react";
import styled from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { getBorderCSSShorthand } from "constants/DefaultTheme";
import { Color } from "constants/Colors";

const StyledContainerComponent = styled.div<ContainerComponentProps>`
  ${props =>
    props.containerStyle !== "none"
      ? `
  border: ${getBorderCSSShorthand(props.theme.borders[2])};
  box-shadow: ${props.theme.shadows[0]};
  border-radius: ${
    props.containerStyle === "card" || props.containerStyle === "rounded-border"
      ? props.theme.radii[1]
      : 0
  }px;`
      : ""}
  height: 100%;
  width: 100%;
  background: ${props => props.backgroundColor};
  padding: ${props => props.theme.spaces[1]}px;
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

type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps extends ComponentProps {
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  className?: string;
  backgroundColor?: Color;
}

export default ContainerComponent;
