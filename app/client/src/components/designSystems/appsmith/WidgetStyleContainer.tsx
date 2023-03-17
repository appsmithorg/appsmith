import type { ReactNode } from "react";
import React from "react";
import styled from "styled-components";
import type { ContainerStyle } from "widgets/ContainerWidget/component";
import type { Color } from "constants/Colors";

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
  backgroundColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  className?: string;
  selected?: boolean;
  direction?: string;
}

const WidgetStyle = styled.div<WidgetStyleContainerProps>`
  height: 100%;
  width: 100%;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${(props) => props.boxShadow} !important;
  border-width: ${(props) => props.borderWidth || 0}px;
  border-color: ${(props) => props.borderColor || "transparent"};
  outline: ${(props) =>
    props.selected
      ? `${props.borderWidth || 1}px solid #3b82f6 !important`
      : ""};
  border-style: solid;
  background-color: ${(props) => props.backgroundColor || "transparent"};

  display: block;
  overflow: hidden;

  & > div {
    height: 100%;
    width: 100%;
  }
`;

// wrapper component for apply styles on any widget boundary
function WidgetStyleContainer(props: WidgetStyleContainerProps) {
  return (
    <WidgetStyle {...props} data-testid={`container-wrapper-${props.widgetId}`}>
      {props.children}
    </WidgetStyle>
  );
}

export default WidgetStyleContainer;
