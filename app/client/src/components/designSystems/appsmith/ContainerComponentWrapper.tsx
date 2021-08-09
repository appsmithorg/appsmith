import React, { ReactNode } from "react";
import styled from "styled-components";
import { ContainerStyle } from "./ContainerComponent";
import { Color } from "constants/Colors";

const StyledContainerComponentWrapper = styled.div<ContainerComponentProps>`
  ${(props) =>
    props.containerStyle !== "none"
      ? `
  border-width: ${props.borderWidth}px;
  border-color: ${props.borderColor || "transparent"};
  border-style: solid;
  border-radius: 0;`
      : ""}
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: ${(props) => props.borderRadius}px;
  box-shadow: ${({ boxShadow, boxShadowColor, theme }) =>
    boxShadow === BoxShadowTypes.VARIANT1
      ? `0px 0px 4px 3px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant1}`
      : boxShadow === BoxShadowTypes.VARIANT2
      ? `3px 3px 4px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant2}`
      : boxShadow === BoxShadowTypes.VARIANT3
      ? `0px 1px 3px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant3}`
      : boxShadow === BoxShadowTypes.VARIANT4
      ? `2px 2px 0px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant4}`
      : boxShadow === BoxShadowTypes.VARIANT5
      ? `-2px -2px 0px ${boxShadowColor ||
          theme.colors.button.boxShadow.default.variant5}`
      : "none"} !important;

}`;

export enum BoxShadowTypes {
  NONE = "NONE",
  VARIANT1 = "VARIANT1",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
  VARIANT4 = "VARIANT4",
  VARIANT5 = "VARIANT5",
}
export type BoxShadow = keyof typeof BoxShadowTypes;

// wrapper component on Container widget
// which handle container boundary related styles
function ContainerComponentWrapper(props: ContainerComponentProps) {
  return (
    <StyledContainerComponentWrapper
      {...props}
      data-testid={`container-wrapper-${props.widgetId}`}
    >
      {props.children}
    </StyledContainerComponentWrapper>
  );
}

export interface ContainerComponentProps {
  widgetId: string;
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  borderColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
}

export default ContainerComponentWrapper;
