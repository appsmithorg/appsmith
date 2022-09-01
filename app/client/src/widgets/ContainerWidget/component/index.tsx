import React, {
  ReactNode,
  useRef,
  useEffect,
  RefObject,
  useMemo,
  useState,
} from "react";
import styled, { css } from "styled-components";
import { isArray, pick } from "lodash";
import tinycolor from "tinycolor2";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { useCanvasMinHeightUpdateHook } from "utils/hooks/useCanvasMinHeightUpdateHook";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { ComponentProps } from "widgets/BaseComponent";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import {
  AlignItems,
  Alignment,
  FlexDirection,
  JustifyContent,
  LayoutDirection,
  LayoutWrapperType,
  Overflow,
  Spacing,
} from "components/constants";
import {
  getLayoutProperties,
  LayoutProperties,
} from "utils/layoutPropertiesUtils";
import { useSelector } from "store";
import { getWidgets } from "sagas/selectors";

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

  .auto-temp-no-display {
    position: absolute;
    left: -9999px;
  }
`;

export const FlexContainer = styled.div<{
  useAutoLayout?: boolean;
  flexDirection?: FlexDirection;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  stretchHeight: boolean;
  overflow: Overflow;
}>`
  display: ${({ useAutoLayout }) => (useAutoLayout ? "flex" : "block")};
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  align-items: ${({ alignItems }) => alignItems || "flex-start"};
  flex-wrap: ${({ overflow }) =>
    overflow?.indexOf("wrap") > -1 ? overflow : "nowrap"};

  width: 100%;
  height: ${({ stretchHeight }) => (stretchHeight ? "100%" : "auto")};

  overflow: ${({ overflow }) =>
    overflow?.indexOf("wrap") === -1 ? overflow : "hidden"};
  padding: 4px;

  .wrapper {
    flex: 1 1 auto;
  }
`;

const StartWrapper = styled.div<{
  flexDirection: FlexDirection;
}>`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: flex-start;
  align-items: center;
`;

const EndWrapper = styled.div<{
  flexDirection: FlexDirection;
}>`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: flex-end;
  align-items: center;
`;

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

export function FlexBox(props: FlexBoxProps) {
  const layoutProps = useMemo(
    () => getLayoutProperties(props.direction, props.alignment, props.spacing),
    [props.direction, props.alignment, props.spacing],
  );
  return (
    <FlexContainer
      className={`flex-container-${props.widgetId}`}
      {...layoutProps}
      overflow={props.overflow}
      stretchHeight={props.stretchHeight}
      useAutoLayout={props.useAutoLayout}
    >
      {props.children}
    </FlexContainer>
  );
}

export function LayoutWrapper(props: FlexBoxProps): JSX.Element {
  const allWidgets = useSelector(getWidgets);
  const [startChildren, setStartChildren] = useState([]);
  const [endChildren, setEndChildren] = useState([]);

  useEffect(() => {
    const start: any = [],
      end: any = [];
    if (isArray(props.children) && props.children?.length > 0) {
      for (const child of props.children) {
        const widget = allWidgets[(child as any).props?.widgetId];
        if (widget && widget.wrapperType === LayoutWrapperType.End)
          end.push(child);
        else start.push(child);
      }
      setStartChildren(start);
      setEndChildren(end);
    }
  }, [props.children]);

  const layoutProps: LayoutProperties = useMemo(
    () => getLayoutProperties(props.direction, props.alignment, props.spacing),
    [props.direction, props.alignment, props.spacing],
  );
  return (
    <FlexContainer
      className={`flex-container-${props.widgetId}`}
      {...layoutProps}
      overflow={props.overflow}
      stretchHeight={props.stretchHeight}
      useAutoLayout={props.useAutoLayout}
    >
      <StartWrapper
        className={`wrapper start-wrapper-${props.widgetId}`}
        flexDirection={layoutProps.flexDirection}
      >
        {startChildren}
      </StartWrapper>
      <EndWrapper
        className={`wrapper end-wrapper-${props.widgetId}`}
        flexDirection={layoutProps.flexDirection}
      >
        {endChildren}
      </EndWrapper>
    </FlexContainer>
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
        "backgroundColor",
        "borderColor",
        "borderWidth",
        "borderRadius",
        "boxShadow",
        "useAutoLayout",
        "direction",
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
  useAutoLayout?: boolean;
  direction?: string;
  justifyContent?: string;
  alignItems?: string;
}

export interface FlexBoxProps {
  alignment: Alignment;
  direction: LayoutDirection;
  spacing: Spacing;
  stretchHeight: boolean;
  useAutoLayout: boolean;
  children?: ReactNode;
  widgetId: string;
  overflow: Overflow;
}

export default ContainerComponent;
