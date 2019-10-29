import React, { useContext, CSSProperties, useState } from "react";
import styled, {css}   from "styled-components";
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

const BORDER_INDEX = 1

const HOVER_AREA_WIDTH = 12

function getHandleSyles() : {
  top: CSSProperties;
  bottom: CSSProperties;
  right: CSSProperties;
  left: CSSProperties;
  bottomRight: CSSProperties;
  bottomLeft: CSSProperties;
} {
  const hoverWidth = HOVER_AREA_WIDTH
  const hoverWidthHalf = hoverWidth / 2
  const halfBorder = theme.borders[BORDER_INDEX].thickness / 2 
  const shiftedHoverWidthHalf = hoverWidthHalf + halfBorder
  const hoverCornerWidth = hoverWidth + hoverWidth / 4

  return {
    top: {
      height: hoverWidth + "px",
      top: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ns-resize",
    },
    bottomRight: {
      height: hoverCornerWidth + "px",
      width: hoverCornerWidth + "px",
      zIndex: 1,
      cursor: "nwse-resize",
    },
    bottomLeft: {
      height: hoverCornerWidth + "px",
      width: hoverCornerWidth + "px",
      zIndex: 1,
      cursor: "nesw-resize",
    },
    bottom: {
      height: hoverWidth + "px",
      bottom: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ns-resize",
    },
    left: {
      width: hoverWidth + "px",
      left: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ew-resize",
    },
    right: {
      width: hoverWidth + "px",
      right: "-" + shiftedHoverWidthHalf + "px",
      zIndex: 1,
      cursor: "ew-resize",
    },
  }
}

interface ResizeBorderDotDivProps {
  isfocused: boolean
}

const borderCSS = css<ResizeBorderDotDivProps>`
  position: relative;
  height: 100%;
  opacity: 0.99;
  &:after,
  &:before {
    content: "";
    position: absolute;
    width: ${props => props.theme.spaces[2]}px;
    height: ${props => props.theme.spaces[2]}px;
    border-radius: ${props => props.theme.radii[5]}%;
    background: ${props =>
      props.isfocused && props.theme.colors.containerBorder};
  }
`;

const ResizeBorderDotDiv = styled.div<ResizeBorderDotDivProps>`
  ${borderCSS}
  &:after {
    left: -${props => props.theme.spaces[1]}px;
    top: calc(50% - ${props => props.theme.spaces[1]}px);
    z-index: 0;
  }
  &:before {
    left: calc(50% - ${props => props.theme.spaces[1]}px);
    top: -${props => props.theme.spaces[1]}px;
    z-index: 1;
  }
`;

const ResizableContainer = styled(Rnd)`
  ${borderCSS}
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
  const { isDragging, widgetNode } = useContext(DraggableComponentContext);
  const { setIsResizing } = useContext(ResizingContext);
  const { boundingParent } = useContext(ParentBoundsContext);
  const { updateWidget } = useContext(WidgetFunctionsContext);
  const { showPropertyPane, isFocused, setFocus } = useContext(FocusContext);
  const occupiedSpaces = useContext(OccupiedSpaceContext);

  const [isColliding, setIsColliding] = useState(false);
  const isWidgetFocused = isFocused === props.widgetId

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
    showPropertyPane && showPropertyPane(props.widgetId, widgetNode);

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

  const canResize = !isDragging && isWidgetFocused;
  return (
    <ResizableContainer
      isfocused={isWidgetFocused ? "true" : undefined}
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
        border:
          isFocused === props.widgetId
            ? getBorderCSSShorthand(theme.borders[BORDER_INDEX])
            : "none",
        borderColor: isColliding
          ? getColorWithOpacity(theme.colors.error, 0.6)
          : "inherit",
      }}
      onResizeStop={updateSize}
      onResize={checkForCollision}
      onResizeStart={() => {
        setIsResizing && setIsResizing(true);
        showPropertyPane && showPropertyPane(props.widgetId);
      }}
      resizeGrid={[props.parentColumnSpace, props.parentRowSpace]}
      bounds={bounds}
      resizeHandleStyles={getHandleSyles()}
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
      <ResizeBorderDotDiv isfocused={isWidgetFocused}>
        {props.children}
      </ResizeBorderDotDiv>
    </ResizableContainer>
  );
};

export default ResizableComponent;
