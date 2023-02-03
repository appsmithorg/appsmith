import React, {
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
  useRef,
  useEffect,
  RefObject,
} from "react";
import styled from "styled-components";
import tinycolor from "tinycolor2";
import { generateClassName, getCanvasClassName } from "utils/generators";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { WidgetType } from "utils/WidgetFactory";
import { scrollCSS } from "widgets/WidgetUtils";

const StyledContainerComponent = styled.div<
  Omit<ContainerWrapperProps, "widgetId">
>`
  height: 100%;
  width: 100%;
  overflow: hidden;
  ${(props) => (props.shouldScrollContents ? scrollCSS : ``)}
  opacity: ${(props) => (props.resizeDisabled ? "0.8" : "1")};

  background: ${(props) => props.backgroundColor};
  &:hover {
    background-color: ${(props) => {
      return props.onClickCapture && props.backgroundColor
        ? tinycolor(props.backgroundColor)
            .darken(5)
            .toString()
        : props.backgroundColor;
    }};
    z-index: ${(props) => (props.onClickCapture ? "2" : "1")};
    cursor: ${(props) => (props.onClickCapture ? "pointer" : "inherit")};
  }

  .auto-temp-no-display {
    position: absolute;
    left: -9999px;
  }

  .no-display {
    display: none;
  }
`;

interface ContainerWrapperProps {
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
  resizeDisabled?: boolean;
  shouldScrollContents?: boolean;
  backgroundColor?: string;
  widgetId: string;
  type: WidgetType;
}
function ContainerComponentWrapper(
  props: PropsWithChildren<ContainerWrapperProps>,
) {
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
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      backgroundColor={props.backgroundColor}
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)} container-with-scrollbar`}
      onClickCapture={props.onClickCapture}
      ref={containerRef}
      resizeDisabled={props.resizeDisabled}
      shouldScrollContents={!!props.shouldScrollContents}
      tabIndex={props.shouldScrollContents ? undefined : 0}
      type={props.type}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

function ContainerComponent(props: ContainerComponentProps) {
  if (props.detachFromLayout) {
    return (
      <ContainerComponentWrapper
        onClickCapture={props.onClickCapture}
        resizeDisabled={props.resizeDisabled}
        shouldScrollContents={props.shouldScrollContents}
        type={props.type}
        widgetId={props.widgetId}
      >
        {props.children}
      </ContainerComponentWrapper>
    );
  }
  return (
    <WidgetStyleContainer
      backgroundColor={props.backgroundColor}
      borderColor={props.borderColor}
      borderRadius={props.borderRadius}
      borderWidth={props.borderWidth}
      boxShadow={props.boxShadow}
      className="style-container"
      containerStyle={props.containerStyle}
      widgetId={props.widgetId}
    >
      <ContainerComponentWrapper
        backgroundColor={props.backgroundColor}
        onClickCapture={props.onClickCapture}
        resizeDisabled={props.resizeDisabled}
        shouldScrollContents={props.shouldScrollContents}
        type={props.type}
        widgetId={props.widgetId}
      >
        {props.children}
      </ContainerComponentWrapper>
    </WidgetStyleContainer>
  );
}

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps extends WidgetStyleContainerProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  resizeDisabled?: boolean;
  detachFromLayout?: boolean;
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
  backgroundColor?: string;
  type: WidgetType;
  noScroll?: boolean;
  selected?: boolean;
  focused?: boolean;
  minHeight?: number;
  useAutoLayout?: boolean;
  direction?: string;
  justifyContent?: string;
  alignItems?: string;
}

export default ContainerComponent;
