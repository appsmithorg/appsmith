import React from "react";
import { XYCoord } from "react-dnd";
import styled from "styled-components";
import { snapToGrid } from "../utils/helpers";
import { theme } from "../constants/DefaultTheme";

const DropZoneWrapper = styled.div`
  position: absolute;
  z-index: 10;
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
  parentRowHeight: number;
  parentColumnWidth: number;
  canDrop: boolean;
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
      const [leftColumn, topRow] = snapToGrid(
        props.parentColumnWidth,
        props.parentRowHeight,
        props.currentOffset.x - props.parentOffset.x,
        props.currentOffset.y - props.parentOffset.y,
      );
      wrapperProps = {
        visible: true,
        left: leftColumn * props.parentColumnWidth,
        top: topRow * props.parentRowHeight,
        height: props.height * props.parentRowHeight,
        width: props.width * props.parentColumnWidth,
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
        background: props.canDrop ? theme.colors.hover : theme.colors.error,
      }}
    />
  );
};

export default DropZone;
