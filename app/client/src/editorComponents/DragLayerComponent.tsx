import React from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";

const WrappedDragLayer = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 100;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
`;

type DragLayerProps = {
  height: number;
  width: number;
  parentOffset: XYCoord;
  cellSize: number;
  visible: boolean;
};

const DragLayerComponent = (props: DragLayerProps) => {
  const { isDragging, currentOffset } = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging) {
    return null;
  }
  return (
    <WrappedDragLayer>
      <DropZone {...props} currentOffset={currentOffset as XYCoord} />
    </WrappedDragLayer>
  );
};
export default DragLayerComponent;
