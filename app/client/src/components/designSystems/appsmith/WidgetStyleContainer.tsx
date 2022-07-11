import React, { ReactNode } from "react";
import styled from "styled-components";
import { ContainerStyle } from "widgets/ContainerWidget/component";
import { Color } from "constants/Colors";
import { LayoutDirection } from "components/constants";

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
  useAutoLayout?: boolean;
  direction?: string;
}

const WidgetStyle = styled.div<WidgetStyleContainerProps>`
  height: 100%;
  width: 100%;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${(props) => props.boxShadow} !important;
  border-width: ${(props) => props.borderWidth}px;
  border-color: ${(props) => props.borderColor || "transparent"};
  border-style: solid;
  background-color: ${(props) => props.backgroundColor || "transparent"};

  display: ${({ useAutoLayout }) => (useAutoLayout ? "flex" : "block")};
  flex-direction: ${({ direction }) =>
    direction === LayoutDirection.Vertical ? "column" : "row"};
  justify-content: flex-start;
  align-items: ${({ direction }) =>
    direction === LayoutDirection.Vertical ? "stretch" : "flex-start"};
  flex-wrap: wrap;

  & > div {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
`;

// wrapper component for apply styles on any widget boundary
function WidgetStyleContainer(props: WidgetStyleContainerProps) {
  return (
    <WidgetStyle {...props} data-testid={`container-wrapper-${props.widgetId}`}>
      <div>{props.children}</div>
    </WidgetStyle>
  );
}

export default WidgetStyleContainer;
