import React from "react";
import { XYCoord } from "react-dnd";
import styled from "styled-components";
import { snapToGrid } from "utils/helpers";
import { theme, IntentColors } from "constants/DefaultTheme";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";

const DropZoneWrapper = styled.div`
  position: absolute;
  background: ${props => props.theme.colors.hover};
  border: 1px dashed ${props => props.theme.colors.textAnchor};
  opacity: 0.6;
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

const generateDropZoneStyles = (
  props: {
    visible: boolean;
    left: number;
    top: number;
    height: number;
    width: number;
  },
  canDrop: boolean,
  isSnapping: boolean,
) => {
  let background = theme.colors.hover;
  if (!isSnapping) {
    background = IntentColors.success;
  } else if (!canDrop) {
    background = theme.colors.error;
  }
  return {
    display: props.visible ? "block" : "none",
    left: props.left + "px",
    width: props.width + "px",
    top: props.top + "px",
    height: props.height + "px",
    background,
    transition: isSnapping ? "all 0.1s linear" : "none",
  };
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
  let wrapperPropsWithSnap = {
    visible: false,
    left: 0,
    top: 0,
    height: 0,
    width: 0,
  };
  if (
    props.visible &&
    props.currentOffset &&
    props.currentOffset.x >= props.parentOffset.x
  ) {
    wrapperProps = {
      visible: true,
      left: props.currentOffset.x - props.parentOffset.x,
      top: props.currentOffset.y - props.parentOffset.y,
      height: props.height * props.parentRowHeight,
      width: props.width * props.parentColumnWidth,
    };
    const [leftColumn, topRow] = snapToGrid(
      props.parentColumnWidth,
      props.parentRowHeight,
      props.currentOffset.x - props.parentOffset.x,
      props.currentOffset.y - props.parentOffset.y,
    );
    wrapperPropsWithSnap = {
      visible: true,
      left: leftColumn * props.parentColumnWidth + CONTAINER_GRID_PADDING,
      top: topRow * props.parentRowHeight + CONTAINER_GRID_PADDING,
      height: props.height * props.parentRowHeight,
      width: props.width * props.parentColumnWidth,
    };
  }

  return (
    <React.Fragment>
      <DropZoneWrapper
        style={generateDropZoneStyles(
          wrapperPropsWithSnap,
          props.canDrop,
          true,
        )}
      />
      <DropZoneWrapper
        style={generateDropZoneStyles(wrapperProps, props.canDrop, false)}
      />
    </React.Fragment>
  );
};

export default DropZone;
