import React, { useContext, CSSProperties, useState } from "react";
import styled from "styled-components";
import { Rnd } from "react-rnd";
import { XYCoord } from "react-dnd";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { OccupiedSpaceContext } from "../widgets/ContainerWidget";
import { ContainerProps, ParentBoundsContext } from "./ContainerComponent";
import { isDropZoneOccupied } from "../utils/WidgetPropsUtils";
import { FocusContext } from "../pages/Editor/Canvas";
import { DraggableComponentContext } from "./DraggableComponent";
import { WidgetFunctionsContext } from "../pages/Editor/WidgetsEditor";
import { ResizingContext } from "./DropTargetComponent";
import {
  theme,
  getColorWithOpacity,
  getBorderCSSShorthand,
} from "../constants/DefaultTheme";

export type ResizableComponentProps = WidgetProps & ContainerProps;

const handleStyles: {
  top: CSSProperties;
  bottom: CSSProperties;
  right: CSSProperties;
  left: CSSProperties;
  bottomRight: CSSProperties;
  bottomLeft: CSSProperties;
} = {
  top: {
    height: "30px",
    top: "-15px",
    zIndex: 1,
    cursor: "ns-resize",
  },
  bottomRight: {
    height: "30px",
    width: "30px",
    cursor: "nwse-resize",
  },
  bottomLeft: {
    height: "30px",
    width: "30px",
    cursor: "nesw-resize",
  },
  bottom: {
    height: "30px",
    bottom: "-15px",
    zIndex: 1,
    cursor: "ns-resize",
  },
  left: {
    width: "30px",
    left: "-15px",
    zIndex: 1,
    cursor: "ew-resize",
  },
  right: {
    width: "30px",
    right: "-15px",
    zIndex: 1,
    cursor: "ew-resize",
  },
};

const ResizableContainer = styled(Rnd)`
  position: relative;
  opacity: 0.99;
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
    z-index: 0;
  }

  &:before {
    left: calc(50% - ${props => props.theme.spaces[1]}px);
    bottom: -${props => props.theme.spaces[1]}px;
    z-index: 1;
  }
`;

export const ResizableComponent = (props: ResizableComponentProps) => {
  const { isDragging } = useContext(DraggableComponentContext);
  const { setIsResizing } = useContext(ResizingContext);
  const { boundingParent } = useContext(ParentBoundsContext);
  const { updateWidget } = useContext(WidgetFunctionsContext);
  const { isFocused, setFocus, showPropertyPane } = useContext(FocusContext);
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
    if (
      !isColliding &&
      (props.leftColumn !== leftColumn ||
        props.topRow !== topRow ||
        props.bottomRow !== bottomRow ||
        props.rightColumn !== rightColumn)
    ) {
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

  const canResize = !isDragging && isFocused === props.widgetId;
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
        border:
          isFocused === props.widgetId
            ? getBorderCSSShorthand(theme.borders[1])
            : getBorderCSSShorthand(theme.borders[0]),
      }}
      onResizeStop={updateSize}
      onResize={checkForCollision}
      onResizeStart={() => {
        setIsResizing && setIsResizing(true);
        showPropertyPane && showPropertyPane(props.widgetId, undefined);
      }}
      resizeGrid={[props.parentColumnSpace, props.parentRowSpace]}
      bounds={bounds}
      resizeHandleStyles={handleStyles}
      enableResizing={{
        top: canResize,
        right: canResize,
        bottom: canResize,
        left: canResize,
        topRight: canResize,
        topLeft: canResize,
        bottomRight: canResize,
        bottomLeft: canResize,
      }}
    >
      {props.children}
    </ResizableContainer>
  );
};

export default ResizableComponent;
