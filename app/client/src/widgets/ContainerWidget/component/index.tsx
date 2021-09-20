import React, { ReactNode, useRef, useEffect, RefObject } from "react";
import styled, { css } from "styled-components";
import tinycolor from "tinycolor2";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { useCanvasMinHeightUpdateHook } from "utils/hooks/useCanvasMinHeightUpdateHook";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { pick } from "lodash";
import { ComponentProps } from "widgets/BaseComponent";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

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
}`;

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
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)}`}
      containerStyle={containerStyle}
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      ref={containerRef}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

function ContainerComponent(props: ContainerComponentProps) {
  useCanvasMinHeightUpdateHook(props.widgetId, props.minHeight);
  return props.widgetId === MAIN_CONTAINER_WIDGET_ID ? (
    <ContainerComponentWrapper {...props} />
  ) : (
    <WidgetStyleContainer
      {...pick(props, [
        "widgetId",
        "containerStyle",
        "borderColor",
        "borderWidth",
        "borderRadius",
        "boxShadow",
        "boxShadowColor",
      ])}
    >
      <ContainerComponentWrapper {...props} />
    </WidgetStyleContainer>
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
