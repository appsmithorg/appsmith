import React, { useContext } from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";
import { noCollision, currentDropRow } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import DropTargetMask from "./DropTargetMask";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { DropTargetContext } from "./DropTargetComponent";
const WrappedDragLayer = styled.div`
  position: absolute;
  pointer-events: none;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
`;

type DragLayerProps = {
  parentOffset: XYCoord;
  parentRowHeight: number;
  parentColumnWidth: number;
  visible: boolean;
  dropTargetOffset: XYCoord;
  occupiedSpaces?: OccupiedSpace[];
  onBoundsUpdate: Function;
  isOver: boolean;
  parentRows?: number;
  parentCols?: number;
  isResizing?: boolean;
  parentWidgetId: string;
};

const DragLayerComponent = (props: DragLayerProps) => {
  const { updateDropTargetRows } = useContext(DropTargetContext);
  const { isDragging, currentOffset, widget, canDrop } = useDragLayer(
    monitor => ({
      isDragging: monitor.isDragging(),
      currentOffset: monitor.getSourceClientOffset(),
      widget: monitor.getItem(),
      canDrop: noCollision(
        monitor.getSourceClientOffset() as XYCoord,
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

  if (
    props.visible &&
    props.parentWidgetId === MAIN_CONTAINER_WIDGET_ID &&
    currentOffset &&
    props.parentRows
  ) {
    const row = currentDropRow(
      props.parentRowHeight,
      props.parentOffset.y,
      currentOffset.y,
      widget,
    );

    updateDropTargetRows && updateDropTargetRows(row);
  }

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

  /* 
  When the parent offsets are not updated, we don't need to show the dropzone, as the dropzone
  will be rendered at an incorrect coordinates. 
  We can be sure that the parent offset has been calculated
  when the coordiantes are not [0,0].
  */

  const isParentOffsetCalculated =
    props.parentOffset.x > 0 && props.parentOffset.y > 0;
  return (
    <WrappedDragLayer>
      <DropTargetMask
        rowHeight={props.parentRowHeight}
        columnWidth={props.parentColumnWidth}
        setBounds={props.onBoundsUpdate}
      />
      {props.visible &&
        props.isOver &&
        currentOffset &&
        isParentOffsetCalculated && (
          <DropZone
            parentOffset={props.parentOffset}
            parentRowHeight={props.parentRowHeight}
            parentColumnWidth={props.parentColumnWidth}
            width={widgetWidth}
            height={widgetHeight}
            currentOffset={currentOffset as XYCoord}
            canDrop={canDrop}
          />
        )}
    </WrappedDragLayer>
  );
};
export default DragLayerComponent;
