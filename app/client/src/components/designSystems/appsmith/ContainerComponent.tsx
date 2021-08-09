import React, { ReactNode, useRef, useEffect, RefObject } from "react";
import styled, { css } from "styled-components";
import tinycolor from "tinycolor2";
import { ComponentProps } from "./BaseComponent";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { useCanvasMinHeightUpdateHook } from "utils/hooks/useCanvasMinHeightUpdateHook";
import ContainerComponentWrapper, {
  BoxShadowTypes,
} from "components/designSystems/appsmith/ContainerComponentWrapper";
import { pick } from "lodash";

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

function ContainerComponent(props: ContainerComponentProps) {
  const containerStyle = props.containerStyle || "card";
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  useCanvasMinHeightUpdateHook(props.widgetId, props.minHeight);
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
    <ContainerComponentWrapper
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
    </ContainerComponentWrapper>
  );
}

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps extends ComponentProps {
  containerStyle?: ContainerStyle;
  children?: ReactNode;
  className?: string;
  backgroundColor?: Color;
  borderColor?: Color;
  borderWidth?: number;
  borderRadius?: number;
  shouldScrollContents?: boolean;
  resizeDisabled?: boolean;
  selected?: boolean;
  focused?: boolean;
  minHeight?: number;
  boxShadow?: BoxShadowTypes;
  boxShadowColor?: string;
}

export default ContainerComponent;
