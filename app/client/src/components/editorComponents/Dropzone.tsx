import React, { useEffect, forwardRef, Ref } from "react";
import { XYCoord } from "react-dnd";
import styled from "styled-components";
import { snapToGrid } from "utils/helpers";
import { IntentColors } from "constants/DefaultTheme";
import { useSpring, animated, interpolate, config } from "react-spring";
import { Layers } from "constants/Layers";

const SPRING_CONFIG = {
  ...config.gentle,
  clamp: true,
  friction: 0,
  tension: 999,
};
const DropZoneWrapper = styled.div<{
  width: number;
  height: number;
  candrop: boolean;
}>`
  width: ${(props) => props.width}px;
  height: ${[(props) => props.height]}px;
  position: absolute;
  background: ${(props) => (props.candrop ? IntentColors.success : "#333")};
  ${(props) =>
    !props.candrop
      ? `
  background-image: linear-gradient(45deg, #EB2121 8.33%, #33322A 8.33%, #33322A 50%, #EB2121 50%, #EB2121 58.33%, #33322A 58.33%, #33322A 100%);
  background-size: 16.97px 16.97px;
  `
      : ""}
  border: 1px dashed ${(props) => props.theme.colors.textAnchor};
  will-change: transform;
  opacity: 0.6;
  transition: visibility 0s 2s, opacity 2s linear;
  z-index: 1;
`;

const SnappedDropZoneWrapper = styled(DropZoneWrapper)<{ candrop: boolean }>`
  background: ${(props) =>
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

export const getSnappedXY = (
  parentColumnWidth: number,
  parentRowHeight: number,
  currentOffset: XYCoord,
  parentOffset: XYCoord,
) => {
  // TODO(abhinav): There is a simpler math to use.
  const [leftColumn, topRow] = snapToGrid(
    parentColumnWidth,
    parentRowHeight,
    currentOffset.x - parentOffset.x,
    currentOffset.y - parentOffset.y,
  );
  return {
    X: leftColumn * parentColumnWidth,
    Y: topRow * parentRowHeight,
  };
};

/* eslint-disable react/display-name */

export const DropZone = forwardRef(
  (props: DropZoneProps, ref: Ref<HTMLDivElement>) => {
    const [{ X, Y }, setXY] = useSpring<{
      X: number;
      Y: number;
    }>(() => ({
      X: props.currentOffset.x - props.parentOffset.x,
      Y: props.currentOffset.y - props.parentOffset.y,
      config: SPRING_CONFIG,
    }));

    const [{ snappedX, snappedY }, setSnappedXY] = useSpring<{
      snappedX: number;
      snappedY: number;
    }>(() => ({
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
      <>
        <AnimatedDropZone
          candrop={props.canDrop}
          height={props.height * props.parentRowHeight}
          ref={ref}
          style={{
            zIndex: Layers.animatedDropZone,
            transform: interpolate(
              [X, Y],
              (x: number, y: number) => `translate3d(${x}px,${y}px,0)`,
            ),
          }}
          width={props.width * props.parentColumnWidth}
        />
        <AnimatedSnappingDropZone
          candrop={props.canDrop}
          height={props.height * props.parentRowHeight}
          style={{
            zIndex: Layers.animatedSnappingDropZone,
            transform: interpolate(
              [snappedX, snappedY],
              (x: number, y: number) => `translate3d(${x}px,${y}px,0)`,
            ),
          }}
          width={props.width * props.parentColumnWidth}
        />
      </>
    );
  },
);

export default DropZone;
