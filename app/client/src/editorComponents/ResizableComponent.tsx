import React, { useContext } from "react";
import styled from "styled-components";
import { Resizable, ResizeDirection } from "re-resizable";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { ContainerProps, ParentBoundsContext } from "./ContainerComponent";

export type ResizableComponentProps = WidgetProps & ContainerProps;

const ResizableContainer = styled(Resizable)`
  position: relative;
  z-index: 10;
  border: ${props => {
    return Object.values(props.theme.borders[0]).join(" ");
  }};
  &:after,
  &:before {
    content: "";
    position: absolute;
    width: ${props => props.theme.spaces[2]}px;
    height: ${props => props.theme.spaces[2]}px;
    border-radius: ${props => props.theme.radii[5]}%;
    z-index: 9;
    background: ${props => props.theme.colors.containerBorder};
  }
  &:after {
    right: -${props => props.theme.spaces[1]}px;
    top: calc(50% - ${props => props.theme.spaces[1]}px);
  }

  &:before {
    left: calc(50% - ${props => props.theme.spaces[1]}px);
    bottom: -${props => props.theme.spaces[1]}px;
  }
`;

export const ResizableComponent = (props: ResizableComponentProps) => {
  const { boundingParent } = useContext(ParentBoundsContext);
  const updateSize = (
    e: Event,
    dir: ResizeDirection,
    ref: any,
    delta: { width: number; height: number },
  ) => {
    props.updateWidget &&
      props.updateWidget(WidgetOperations.RESIZE, props.widgetId, delta);
  };
  return (
    <ResizableContainer
      size={{
        width: props.style.componentWidth as number,
        height: props.style.componentHeight as number,
      }}
      minWidth={props.parentColumnSpace}
      minHeight={props.parentRowSpace}
      style={{ ...props.style }}
      onResizeStop={updateSize}
      grid={[props.parentColumnSpace, props.parentRowSpace]}
      bounds={boundingParent ? boundingParent.current || undefined : "window"}
      enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        topLeft: false,
        bottomRight: false,
        bottomLeft: false,
      }}
    >
      {props.children}
    </ResizableContainer>
  );
};

export default ResizableComponent;
