import React from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";
import { noCollision } from "../../utils/WidgetPropsUtils";
import { OccupiedSpace } from "../../widgets/ContainerWidget";
import DropTargetMask from "./DropTargetMask";

const WrappedDragLayer = styled.div`
  position: absolute;
  pointer-events: none;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
`;

type DragLayerProps = {
  parentOffset: XYCoord;
  parentRowHeight: number;
  parentColumnWidth: number;
  visible: boolean;
  dropTargetOffset: XYCoord;
  occupiedSpaces: OccupiedSpace[] | null;
  onBoundsUpdate: Function;
  isOver: boolean;
  parentRows?: number;
  parentCols?: number;
  isResizing?: boolean;
};

const DragLayerComponent = (props: DragLayerProps) => {
  const { isDragging, currentOffset, widget, canDrop } = useDragLayer(
    monitor => ({
      isDragging: monitor.isDragging(),
      currentOffset: monitor.getClientOffset(),
      widget: monitor.getItem(),
      canDrop: noCollision(
        monitor.getClientOffset() as XYCoord,
        props.parentColumnWidth,
        props.parentRowHeight,
        monitor.getItem(),
        props.dropTargetOffset,
        props.occupiedSpaces,
        props.parentRows,
        props.parentCols,
      ),
    }),
  );
  let widgetWidth = 0;
  let widgetHeight = 0;
  if (widget) {
    widgetWidth = widget.columns
      ? widget.columns
      : widget.rightColumn - widget.leftColumn;
    widgetHeight = widget.rows ? widget.rows : widget.bottomRow - widget.topRow;
  }
  if ((!isDragging || !props.visible) && !props.isResizing) {
    return null;
  }
  return (
    <WrappedDragLayer>
      <DropTargetMask
        rowHeight={props.parentRowHeight}
        columnWidth={props.parentColumnWidth}
        setBounds={props.onBoundsUpdate}
        showGrid={(isDragging && props.isOver) || props.isResizing}
      />
      <DropZone
        {...props}
        visible={props.visible && props.isOver}
        width={widgetWidth}
        height={widgetHeight}
        currentOffset={currentOffset as XYCoord}
        canDrop={canDrop}
      />
    </WrappedDragLayer>
  );
};
export default DragLayerComponent;
