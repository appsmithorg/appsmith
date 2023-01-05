import React, { MouseEventHandler, PropsWithChildren, ReactNode } from "react";
import styled, { css } from "styled-components";
import { generateClassName, getCanvasClassName } from "utils/generators";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import tinycolor from "tinycolor2";
import { WidgetType } from "utils/WidgetFactory";

// This is to be applied to only those widgets which will scroll for example, container widget, etc.
// But this won't apply to CANVAS_WIDGET.
const scrollCSS = css`
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  overflow-y: overlay;

  scrollbar-color: #cccccc transparent;
  scroolbar-width: thin;

  &::-webkit-scrollbar-thumb {
    background: #cccccc !important;
  }
  &::-webkit-scrollbar-track {
    background: transparent !important;
  }
`;

const StyledContainerComponent = styled.div<ContainerWrapperProps>`
  height: 100%;
  width: 100%;
  ${(props) => (props.noScroll ? `` : scrollCSS)}
  &:hover {
    background-color: ${(props) => {
      return props.onClickCapture && props.backgroundColor
        ? tinycolor(props.backgroundColor)
            .darken(5)
            .toString()
        : props.backgroundColor;
    }};
  }
  opacity: ${(props) => (props.resizeDisabled ? "0.8" : "1")};
  z-index: ${(props) => (props.onClickCapture ? "2" : "1")};
  cursor: ${(props) => (props.onClickCapture ? "pointer" : "inherit")};
`;

interface ContainerWrapperProps {
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
  resizeDisabled?: boolean;
  shouldScrollContents?: boolean;
  backgroundColor?: string;
  widgetId: string;
  type: WidgetType;
  noScroll?: boolean; // If this is a CANVAS_WIDGET, we don't want any scroll behaviour
}
function ContainerComponentWrapper(
  props: PropsWithChildren<ContainerWrapperProps>,
) {
  return (
    <StyledContainerComponent
      {...props}
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)} container-with-scrollbar`}
      noScroll={props.noScroll}
      tabIndex={props.shouldScrollContents ? undefined : 0}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

function ContainerComponent(props: ContainerComponentProps) {
  if (props.detachFromLayout) {
    return (
      <ContainerComponentWrapper
        noScroll={props.noScroll}
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
      containerStyle={props.containerStyle}
      widgetId={props.widgetId}
    >
      <ContainerComponentWrapper
        noScroll={props.noScroll}
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
}

export default ContainerComponent;
