import React, { ReactNode } from "react";
import styled from "styled-components";
import { ContainerStyle } from "widgets/ContainerWidget/component";
import { Color } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";

export enum BoxShadowTypes {
  NONE = "NONE",
  VARIANT1 = "VARIANT1",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
  VARIANT4 = "VARIANT4",
  VARIANT5 = "VARIANT5",
}

export type BoxShadow = keyof typeof BoxShadowTypes;

export interface WidgetStyleContainerProps {
  widgetId: string;
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  borderColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
}

// get box shadow style string based on boxShadow and boxShadowColor
const getBoxShadow = ({
  boxShadow,
  boxShadowColor,
  theme,
}: {
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
  theme: Theme;
}) => {
  switch (boxShadow) {
    case BoxShadowTypes.VARIANT1:
      return `0px 0px 4px 3px ${boxShadowColor ||
        theme.colors.button.boxShadow.default.variant1}`;
    case BoxShadowTypes.VARIANT2:
      return `3px 3px 4px ${boxShadowColor ||
        theme.colors.button.boxShadow.default.variant2}`;
    case BoxShadowTypes.VARIANT3:
      return `0px 1px 3px ${boxShadowColor ||
        theme.colors.button.boxShadow.default.variant3}`;
    case BoxShadowTypes.VARIANT4:
      return `2px 2px 0px ${boxShadowColor ||
        theme.colors.button.boxShadow.default.variant4}`;
    case BoxShadowTypes.VARIANT5:
      return `-2px -2px 0px ${boxShadowColor ||
        theme.colors.button.boxShadow.default.variant5}`;
    default:
      return "none";
  }
};

const WidgetStyle = styled.div<WidgetStyleContainerProps>`
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: ${(props) => props.borderRadius}px;
  box-shadow: ${(props) => getBoxShadow(props)} !important;
  & > div {
    ${(props) =>
      props.containerStyle !== "none"
        ? `
    border-width: ${props.borderWidth}px;
    border-radius: ${props.borderRadius}px;
    border-color: ${props.borderColor || "transparent"};
    border-style: solid;`
        : ""}
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
}`;

// wrapper component for apply styles on any widget boundary
function WidgetStyleContainer(props: WidgetStyleContainerProps) {
  return (
    <WidgetStyle {...props} data-testid={`container-wrapper-${props.widgetId}`}>
      <div>{props.children}</div>
    </WidgetStyle>
  );
}

export default WidgetStyleContainer;
