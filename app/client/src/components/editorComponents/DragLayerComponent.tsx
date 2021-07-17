import React from "react";
import styled from "styled-components";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
const GRID_POINT_SIZE = 1;
const WrappedDragLayer = styled.div<{
  columnWidth: number;
  rowHeight: number;
  noPad: boolean;
}>`
  position: absolute;
  pointer-events: none;
  left: ${(props) =>
    props.noPad ? "0" : `${CONTAINER_GRID_PADDING - GRID_POINT_SIZE}px;`};
  top: ${(props) =>
    props.noPad ? "0" : `${CONTAINER_GRID_PADDING - GRID_POINT_SIZE}px;`};
  height: ${(props) =>
    props.noPad
      ? `100%`
      : `calc(100% - ${(CONTAINER_GRID_PADDING - GRID_POINT_SIZE) * 2}px)`};
  width: ${(props) =>
    props.noPad
      ? `100%`
      : `calc(100% - ${(CONTAINER_GRID_PADDING - GRID_POINT_SIZE) * 2}px)`};

  background-image: radial-gradient(
    circle at ${GRID_POINT_SIZE}px ${GRID_POINT_SIZE}px,
    ${(props) => props.theme.colors.grid} ${GRID_POINT_SIZE}px,
    transparent 0
  );
  background-size: ${(props) =>
      props.columnWidth - GRID_POINT_SIZE / GridDefaults.DEFAULT_GRID_COLUMNS}px
    ${(props) => props.rowHeight}px;
`;

type DragLayerProps = {
  parentRowHeight: number;
  parentColumnWidth: number;
  noPad: boolean;
};

function DragLayerComponent(props: DragLayerProps) {
  return (
    <WrappedDragLayer
      columnWidth={props.parentColumnWidth}
      noPad={props.noPad}
      rowHeight={props.parentRowHeight}
    />
  );
}
export default DragLayerComponent;
