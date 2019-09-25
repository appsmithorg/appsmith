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
  parentOffset: XYCoord;
  parentRowHeight: number;
  parentColumnWidth: number;
  visible: boolean;
};

const DragLayerComponent = (props: DragLayerProps) => {
  const { isDragging, currentOffset, widget } = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getClientOffset(),
    widget: monitor.getItem(),
  }));
  let widgetWidth = 0;
  let widgetHeight = 0;
  if (widget) {
    widgetWidth = widget.columns
      ? widget.columns
      : widget.rightColumn - widget.leftColumn;
    widgetHeight = widget.rows ? widget.rows : widget.bottomRow - widget.topRow;
  }

  if (!isDragging || !props.visible) {
    return null;
  }
  return (
    <WrappedDragLayer>
      <DropZone
        {...props}
        width={widgetWidth}
        height={widgetHeight}
        currentOffset={currentOffset as XYCoord}
      />
    </WrappedDragLayer>
  );
};
export default DragLayerComponent;
