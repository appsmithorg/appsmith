import React, { ReactNode, useRef, useEffect, RefObject } from "react";
import styled, { css } from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { getBorderCSSShorthand, invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";

const scrollContents = css`
  overflow-y: auto;
`;

const StyledContainerComponent = styled.div<
  ContainerComponentProps & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  ${(props) =>
    props.containerStyle !== "none"
      ? `
  border: ${getBorderCSSShorthand(props.theme.borders[2])};
  border-radius: 0;`
      : ""}
  height: 100%;
  width: 100%;
  background: ${(props) => props.backgroundColor};

  ${(props) => (!props.isVisible ? invisible : "")};
  overflow: hidden;
  ${(props) => (props.shouldScrollContents ? scrollContents : "")}
}`;

const ContainerComponent = (props: ContainerComponentProps) => {
  const containerStyle = props.containerStyle || "card";
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!props.shouldScrollContents) {
      const supportsNativeSmoothScroll =
        "scrollBehavior" in document.documentElement.style;
      if (supportsNativeSmoothScroll) {
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
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
