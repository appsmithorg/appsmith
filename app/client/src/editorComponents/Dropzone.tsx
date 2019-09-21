import React from "react";
import { XYCoord } from "react-dnd";
import styled from "styled-components";
import { snapToGrid } from "../utils/helpers";
type DropZoneWrapperProps = {
  visible: boolean;
  left: number;
  width: number;
  height: number;
  top: number;
};

const DropZoneWrapper = styled.div`
  position: absolute;
  z-index: 100;
  background: ${props => props.theme.colors.hover};
  border: 1px dashed ${props => props.theme.colors.textAnchor};
  opacity: 0.7;
`;

type DropZoneProps = {
  currentOffset: XYCoord;
  height: number;
  width: number;
  visible: boolean;
  parentOffset: XYCoord;
  cellSize: number;
};

/* eslint-disable react/display-name */
export const DropZone = (props: DropZoneProps) => {
  let wrapperProps = {
    visible: false,
    left: 0,
    top: 0,
    height: 0,
    width: 0,
  };

  if (props.visible) {
    if (props.currentOffset && props.currentOffset.x >= props.parentOffset.x) {
      const [x, y] = snapToGrid(
        props.cellSize,
        props.currentOffset.x - props.parentOffset.x,
        props.currentOffset.y - props.parentOffset.y,
      );
      wrapperProps = {
        visible: true,
        left: x,
        top: y,
        height: props.height,
        width: props.width,
      };
    }
  }

  return (
    <DropZoneWrapper
      style={{
        display: wrapperProps.visible ? "block" : "none",
        left: wrapperProps.left + "px",
        width: wrapperProps.width + "px",
        top: wrapperProps.top + "px",
        height: wrapperProps.height + "px",
      }}
      {...wrapperProps}
    />
  );
};

export default DropZone;
