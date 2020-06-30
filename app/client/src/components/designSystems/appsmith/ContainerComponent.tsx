import React, { ReactNode, useRef, useEffect, RefObject } from "react";
import styled, { css } from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";

const scrollContents = css`
  overflow-y: auto;
  position: absolute;
`;

const StyledContainerComponent = styled.div<
  ContainerComponentProps & {
    ref: RefObject<HTMLDivElement>;
  }
>`
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
  background: ${props => props.backgroundColor};
  box-shadow: ${props =>
    props.containerStyle === "card"
      ? "0 1px 1px 0 rgba(60,75,100,.14),0 2px 1px -1px rgba(60,75,100,.12),0 1px 3px 0 rgba(60,75,100,.2)"
      : "none"};
  ${props => (!props.isVisible ? invisible : "")};
  overflow: hidden;
  ${props => (props.shouldScrollContents ? scrollContents : "")}
}`;

const ContainerComponent = (props: ContainerComponentProps) => {
  const containerStyle = props.containerStyle || "card";
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!props.shouldScrollContents) {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.shouldScrollContents]);
  return (
    <StyledContainerComponent
      {...props}
      ref={containerRef}
      containerStyle={containerStyle}
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)}`}
    >
      {props.children}
    </StyledContainerComponent>
  );
};

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps extends ComponentProps {
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  className?: string;
  backgroundColor?: Color;
  shouldScrollContents?: boolean;
}

export default ContainerComponent;
