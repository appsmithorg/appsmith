import React, {
  useContext,
  useLayoutEffect,
  MutableRefObject,
  useRef,
} from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";
import { noCollision, currentDropRow } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import {
  MAIN_CONTAINER_WIDGET_ID,
  CONTAINER_GRID_PADDING,
} from "constants/WidgetConstants";
import { DropTargetContext } from "./DropTargetComponent";
const WrappedDragLayer = styled.div<{ columnWidth: number; rowHeight: number }>`
  position: absolute;
  pointer-events: none;
  left: ${CONTAINER_GRID_PADDING}px;
  top: ${CONTAINER_GRID_PADDING}px;
  height: calc(100% - ${2 * CONTAINER_GRID_PADDING}px);
  width: calc(100% - ${2 * CONTAINER_GRID_PADDING}px);

  background-image: radial-gradient(
    circle,
    ${props => props.theme.colors.grid} 2px,
    transparent 0
  );
  background-size: ${props => props.columnWidth}px ${props => props.rowHeight}px;
  background-position: -${props => props.columnWidth / 2}px -${props =>
      props.rowHeight / 2}px;
`;

type DragLayerProps = {
  parentRowHeight: number;
  parentColumnWidth: number;
  visible: boolean;
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
  const dropTargetMask: MutableRefObject<HTMLDivElement | null> = React.useRef(
    null,
  );

  const dropTargetOffset = useRef({
    x: 0,
    y: 0,
  });
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
        dropTargetOffset.current,
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
      dropTargetOffset.current.y,
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
  useLayoutEffect(() => {
    const el = dropTargetMask.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (
        rect.x !== dropTargetOffset.current.x ||
        rect.y !== dropTargetOffset.current.y
      ) {
        dropTargetOffset.current = { x: rect.x, y: rect.y };
        props.onBoundsUpdate && props.onBoundsUpdate(rect);
      }
    }
  });

  if ((!isDragging || !props.visible) && !props.isResizing) {
    return null;
  }

  /* 
  When the parent offsets are not updated, we don't need to show the dropzone, as the dropzone
  will be rendered at an incorrect coordinates. 
  We can be sure that the parent offset has been calculated
  when the coordiantes are not [0,0].
  */
  const isParentOffsetCalculated = dropTargetOffset.current.x !== 0;

  return (
    <WrappedDragLayer
      columnWidth={props.parentColumnWidth}
      rowHeight={props.parentRowHeight}
      ref={dropTargetMask}
    >
      {props.visible &&
        props.isOver &&
        currentOffset &&
        isParentOffsetCalculated && (
          <DropZone
            parentOffset={dropTargetOffset.current}
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
