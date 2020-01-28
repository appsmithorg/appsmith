import React, { useEffect } from "react";
import { XYCoord } from "react-dnd";
import styled from "styled-components";
import { snapToGrid } from "utils/helpers";
import { IntentColors } from "constants/DefaultTheme";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
import { useSpring, animated, interpolate, config } from "react-spring";

const SPRING_CONFIG = {
  ...config.gentle,
  clamp: true,
};
const DropZoneWrapper = styled.div<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${[props => props.height]}px;
  position: absolute;
  background: ${IntentColors.success};
  border: 1px dashed ${props => props.theme.colors.textAnchor};
  opacity: 0.6;
  z-index: 1;
`;

const SnappedDropZoneWrapper = styled(DropZoneWrapper)<{ candrop: boolean }>`
  background: ${props =>
    props.candrop ? props.theme.colors.hover : IntentColors.danger};
  z-index: 0;
`;

const AnimatedDropZone = animated(DropZoneWrapper);
const AnimatedSnappingDropZone = animated(SnappedDropZoneWrapper);

type DropZoneProps = {
  currentOffset: XYCoord;
  height: number;
  width: number;
  parentOffset: XYCoord;
  parentRowHeight: number;
  parentColumnWidth: number;
  canDrop: boolean;
};

/* eslint-disable react/display-name */

const getSnappedXY = (
  parentColumnWidth: number,
  parentRowHeight: number,
  currentOffset: XYCoord,
  parentOffset: XYCoord,
) => {
  // TODO(abhinav): There is a simpler math to use.
  const [leftColumn, topRow] = snapToGrid(
    parentColumnWidth,
    parentRowHeight,
    currentOffset.x - parentOffset.x - CONTAINER_GRID_PADDING,
    currentOffset.y - parentOffset.y - CONTAINER_GRID_PADDING,
  );
  return {
    X: leftColumn * parentColumnWidth + CONTAINER_GRID_PADDING,
    Y: topRow * parentRowHeight + CONTAINER_GRID_PADDING,
  };
};
export const DropZone = (props: DropZoneProps) => {
  const [{ X, Y }, setXY] = useSpring(() => ({
    X: props.currentOffset.x - props.parentOffset.x,
    Y: props.currentOffset.y - props.parentOffset.y,
    config: SPRING_CONFIG,
  }));

  const [{ snappedX, snappedY }, setSnappedXY] = useSpring(() => ({
    snappedX: props.currentOffset.x - props.parentOffset.x,
    snappedY: props.currentOffset.y - props.parentOffset.y,
    config: SPRING_CONFIG,
  }));

  useEffect(() => {
    setXY({
      X: props.currentOffset.x - props.parentOffset.x,
      Y: props.currentOffset.y - props.parentOffset.y,
    });
    const snappedXY = getSnappedXY(
      props.parentColumnWidth,
      props.parentRowHeight,
      props.currentOffset,
      props.parentOffset,
    );
    setSnappedXY({
      snappedX: snappedXY.X,
      snappedY: snappedXY.Y,
    });
  }, [
    props.parentColumnWidth,
    props.parentRowHeight,
    props.currentOffset,
    props.parentOffset,
    setSnappedXY,
    setXY,
  ]);

  return (
    <React.Fragment>
      <AnimatedDropZone
        width={props.width * props.parentColumnWidth}
        height={props.height * props.parentRowHeight}
        style={{
          transform: interpolate(
            [X, Y],
            (x: number, y: number) => `translate3d(${x}px,${y}px,0)`,
          ),
        }}
      />
      <AnimatedSnappingDropZone
        width={props.width * props.parentColumnWidth}
        height={props.height * props.parentRowHeight}
        candrop={props.canDrop}
        style={{
          transform: interpolate(
            [snappedX, snappedY],
            (x: number, y: number) => `translate3d(${x}px,${y}px,0)`,
          ),
        }}
      />
    </React.Fragment>
  );
};

export default DropZone;
