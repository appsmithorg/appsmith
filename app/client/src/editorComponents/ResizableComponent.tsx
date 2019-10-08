import React, { useContext, CSSProperties, useState } from "react";
import styled from "styled-components";
import { Rnd } from "react-rnd";
import { XYCoord } from "react-dnd";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { OccupiedSpaceContext } from "../widgets/ContainerWidget";
import { ContainerProps, ParentBoundsContext } from "./ContainerComponent";
import { isDropZoneOccupied } from "../utils/WidgetPropsUtils";
import { ResizingContext } from "./DraggableComponent";
import { FocusContext } from "../pages/Editor/Canvas";
import { WidgetFunctionsContext } from "../pages/Editor";
import { theme, getColorWithOpacity } from "../constants/DefaultTheme";

export type ResizableComponentProps = WidgetProps & ContainerProps;

const handleStyles: {
  top: CSSProperties;
  bottom: CSSProperties;
  right: CSSProperties;
  left: CSSProperties;
} = {
  top: {
    height: "30px",
    top: "-15px",
  },
  bottom: {
    height: "30px",
    bottom: "-15px",
  },
  left: {
    width: "30px",
    left: "-15px",
  },
  right: {
    width: "30px",
    right: "-15px",
  },
};

const ResizableContainer = styled(Rnd)`
  position: relative;
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
  const { setIsResizing } = useContext(ResizingContext);
  const { boundingParent } = useContext(ParentBoundsContext);
  const { updateWidget } = useContext(WidgetFunctionsContext);
  const { setFocus } = useContext(FocusContext);
  const occupiedSpaces = useContext(OccupiedSpaceContext);
  const [isColliding, setIsColliding] = useState(false);

  let bounds = "body";
  if (boundingParent && boundingParent.current) {
    bounds = "." + boundingParent.current.className.split(" ")[1];
  }

  const checkForCollision = (
    e: Event,
    dir: any,
    ref: any,
    delta: { width: number; height: number },
    position: XYCoord,
  ) => {
    const left = props.leftColumn + position.x / props.parentColumnSpace;
    const top = props.topRow + position.y / props.parentRowSpace;

    const right =
      props.rightColumn + (delta.width + position.x) / props.parentColumnSpace;
    const bottom =
      props.bottomRow + (delta.height + position.y) / props.parentRowSpace;

    if (
      isDropZoneOccupied(
        {
          left,
          top,
          bottom,
          right,
        },
        props.widgetId,
        occupiedSpaces,
      )
    ) {
      setIsColliding(true);
    } else {
      if (!!isColliding) {
        setIsColliding(false);
      }
    }
  };
  const updateSize = (
    e: Event,
    dir: any,
    ref: any,
    delta: { width: number; height: number },
    position: XYCoord,
  ) => {
    setIsResizing && setIsResizing(false);
    setFocus && setFocus(props.widgetId);
    const leftColumn = props.leftColumn + position.x / props.parentColumnSpace;
    const topRow = props.topRow + position.y / props.parentRowSpace;

    const rightColumn =
      props.rightColumn + (delta.width + position.x) / props.parentColumnSpace;
    const bottomRow =
      props.bottomRow + (delta.height + position.y) / props.parentRowSpace;

    if (!isColliding) {
      updateWidget &&
        updateWidget(WidgetOperations.RESIZE, props.widgetId, {
          leftColumn,
          rightColumn,
          topRow,
          bottomRow,
        });
    }
    setIsColliding(false);
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
      style={{
        ...props.style,
        background: isColliding
          ? getColorWithOpacity(theme.colors.error, 0.6)
          : props.style.backgroundColor,
      }}
      onResizeStop={updateSize}
      onResize={checkForCollision}
      onResizeStart={() => {
        setIsResizing && setIsResizing(true);
      }}
      resizeGrid={[props.parentColumnSpace, props.parentRowSpace]}
      bounds={bounds}
      resizeHandleStyles={handleStyles}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: false,
        topLeft: false,
        bottomRight: true,
        bottomLeft: false,
      }}
    >
      {props.children}
    </ResizableContainer>
  );
};

export default ResizableComponent;
