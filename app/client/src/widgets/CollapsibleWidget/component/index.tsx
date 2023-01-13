import React, { ReactNode, useRef, useEffect, RefObject } from "react";
import styled, { css } from "styled-components";
import tinycolor from "tinycolor2";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { pick } from "lodash";
import { ComponentProps } from "widgets/BaseComponent";
import { useCollapse } from "./use-collapse";

const scrollContents = css`
  overflow-y: auto;
`;

const StyledContainerComponent = styled.div<
  ContainerComponentProps & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  height: 100%;
  width: 100%;
  background: ${(props) => props.backgroundColor};
  opacity: ${(props) => (props.resizeDisabled ? "0.8" : "1")};
  position: relative;
  ${(props) => (!props.isVisible ? invisible : "")};
  box-shadow: ${(props) =>
    props.selected ? "inset 0px 0px 0px 3px rgba(59,130,246,0.5)" : "none"};
  border-radius: ${({ borderRadius }) => borderRadius};

  ${(props) =>
    props.shouldScrollContents === true
      ? scrollContents
      : props.shouldScrollContents === false
      ? css`
          overflow: hidden;
        `
      : ""}

  &:hover {
    z-index: ${(props) => (props.onClickCapture ? "2" : "1")};
    cursor: ${(props) => (props.onClickCapture ? "pointer" : "inherit")};
    background: ${(props) => {
      return props.onClickCapture && props.backgroundColor
        ? tinycolor(props.backgroundColor)
            .darken(5)
            .toString()
        : props.backgroundColor;
    }};
  }
`;

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
}

const WidgetStyle = styled.div<WidgetStyleContainerProps>`
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${(props) => props.boxShadow} !important;
  border-width: ${(props) => props.borderWidth}px;
  border-color: ${(props) => props.borderColor || "transparent"};
  border-style: solid;
  background-color: ${(props) => props.backgroundColor || "transparent"};
`;

// wrapper component for apply styles on any widget boundary
function WidgetStyleContainer(props: WidgetStyleContainerProps) {
  return (
    <WidgetStyle {...props} data-testid={`container-wrapper-${props.widgetId}`}>
      <div>{props.children}</div>
    </WidgetStyle>
  );
}

function ContainerComponentWrapper(props: ContainerComponentProps) {
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
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)}`}
      containerStyle={containerStyle}
      ref={containerRef}
      tabIndex={props.shouldScrollContents ? undefined : 0}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

const collapseHeaderStyles: React.CSSProperties = {
  boxSizing: "border-box",
  // border: "2px solid black",
  color: "#212121",
  fontFamily: "Helvetica",
  padding: "10px",
  fontSize: "14px",
  cursor: "pointer",
  userSelect: "none",
};

function ContainerComponent(props: ContainerComponentProps) {
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse({});

  return (
    <div>
      <WidgetStyleContainer
        {...pick(props, [
          "widgetId",
          "containerStyle",
          "backgroundColor",
          "borderColor",
          "borderWidth",
          "borderRadius",
          "boxShadow",
        ])}
      >
        <div style={collapseHeaderStyles} {...getToggleProps({})}>
          {isExpanded ? "Close" : "Open"}
        </div>
      </WidgetStyleContainer>
      <div {...getCollapseProps()}>
        <WidgetStyleContainer
          {...pick(props, [
            "widgetId",
            "containerStyle",
            "backgroundColor",
            "borderColor",
            "borderWidth",
            "borderRadius",
            "boxShadow",
          ])}
        >
          <ContainerComponentWrapper {...props} />
        </WidgetStyleContainer>
      </div>
    </div>
  );
}

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps
  extends ComponentProps,
    WidgetStyleContainerProps {
  children?: ReactNode;
  className?: string;
  backgroundColor?: Color;
  shouldScrollContents?: boolean;
  resizeDisabled?: boolean;
  selected?: boolean;
  focused?: boolean;
  minHeight?: number;
}

export default ContainerComponent;
