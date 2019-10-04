import React, { useContext } from "react";
import styled from "styled-components";
import { Rnd } from "react-rnd";
import { XYCoord } from "react-dnd";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { ContainerProps, ParentBoundsContext } from "./ContainerComponent";
import { RnDContext } from "./DraggableComponent";
import { WidgetFunctionsContext } from "../pages/Editor";

export type ResizableComponentProps = WidgetProps & ContainerProps;

const ResizableContainer = styled(Rnd)`
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
  const { setIsResizing, isDragging } = useContext(RnDContext);
  const { boundingParent } = useContext(ParentBoundsContext);
  const { updateWidget } = useContext(WidgetFunctionsContext);
  let bounds = "body";
  if (boundingParent && boundingParent.current) {
    bounds = "." + boundingParent.current.className.split(" ")[1];
  }
  const updateSize = (
    e: Event,
    dir: any,
    ref: any,
    delta: { width: number; height: number },
    position: XYCoord,
  ) => {
    setIsResizing && setIsResizing(false);
    const leftColumn = props.leftColumn + position.x / props.parentColumnSpace;
    const topRow = props.topRow + position.y / props.parentRowSpace;

    const rightColumn =
      props.rightColumn + (delta.width + position.x) / props.parentColumnSpace;
    const bottomRow =
      props.bottomRow + (delta.height + position.y) / props.parentRowSpace;

    updateWidget &&
      updateWidget(WidgetOperations.RESIZE, props.widgetId, {
        leftColumn,
        rightColumn,
        topRow,
        bottomRow,
      });
  };
  return (
    <ResizableContainer
      position={{
        x: 0,
        y: 0,
      }}
      size={{
        width: props.style.componentWidth as number,
        height: props.style.componentHeight as number,
      }}
      disableDragging
      minWidth={props.parentColumnSpace}
      minHeight={props.parentRowSpace}
      style={{ ...props.style }}
      onResizeStop={updateSize}
      onResizeStart={() => {
        setIsResizing && setIsResizing(true);
      }}
      resizeGrid={[props.parentColumnSpace, props.parentRowSpace]}
      bounds={bounds}
      enableResizing={{
        top: true && !isDragging,
        right: true && !isDragging,
        bottom: true && !isDragging,
        left: true && !isDragging,
        topRight: false,
        topLeft: false,
        bottomRight: true && !isDragging,
        bottomLeft: false,
      }}
    >
      {props.children}
    </ResizableContainer>
  );
};

export default ResizableComponent;
