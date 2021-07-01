import React, { RefObject, useRef } from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import { noCollision } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
const GRID_POINT_SIZE = 1;
const WrappedDragLayer = styled.div<{
  columnWidth: number;
  rowHeight: number;
  noPad: boolean;
  ref: RefObject<HTMLDivElement>;
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
    ${(props) =>
      props.rowHeight - GRID_POINT_SIZE / GridDefaults.DEFAULT_GRID_COLUMNS}px;
`;

type DragLayerProps = {
  parentRowHeight: number;
  canDropTargetExtend: boolean;
  parentColumnWidth: number;
  visible: boolean;
  occupiedSpaces?: OccupiedSpace[];
  onBoundsUpdate: (rect: DOMRect) => void;
  isOver: boolean;
  parentRows?: number;
  parentCols?: number;
  isResizing?: boolean;
  parentWidgetId: string;
  force: boolean;
  noPad: boolean;
};

function DragLayerComponent(props: DragLayerProps) {
  // const { updateDropTargetRows } = useContext(DropTargetContext);
  const dropTargetMask: RefObject<HTMLDivElement> = React.useRef(null);
  // useEffect(() => {
  //   const el = dropZoneRef.current;
  //   const scrollParent: Element | null = getNearestParentCanvas(
  //     dropTargetMask.current,
  //   );
  //   if (dropTargetMask.current) {
  //     if (el && props.canDropTargetExtend) {
  //       scrollElementIntoParentCanvasView(el, scrollParent);
  //     }
  //   }
  // });

  const dropTargetOffset = useRef({
    x: 0,
    y: 0,
  });
  const { isDragging } = useDragLayer((monitor) => ({
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
  }));

  // if (
  //   currentOffset &&
  //   props.isOver &&
  //   props.canDropTargetExtend &&
  //   isDragging
  // ) {
  //   const row = currentDropRow(
  //     props.parentRowHeight,
  //     dropTargetOffset.current.y,
  //     currentOffset.y,
  //     widget,
  //   );

  //   updateDropTargetRows && updateDropTargetRows(widget.widgetId, row);
  // }

  // let widgetWidth = 0;
  // let widgetHeight = 0;
  // if (widget) {
  //   widgetWidth = widget.columns
  //     ? widget.columns
  //     : widget.rightColumn - widget.leftColumn;
  //   widgetHeight = widget.rows ? widget.rows : widget.bottomRow - widget.topRow;
  // }
  // useEffect(() => {
  //   const el = dropTargetMask.current;
  //   if (el) {
  //     const rect = el.getBoundingClientRect();
  //     if (
  //       rect.x !== dropTargetOffset.current.x ||
  //       rect.y !== dropTargetOffset.current.y
  //     ) {
  //       dropTargetOffset.current = { x: rect.x, y: rect.y };
  //       props.onBoundsUpdate && props.onBoundsUpdate(rect);
  //     }
  //   }
  // });

  if (
    (!isDragging || !props.visible || !props.isOver) &&
    !props.force &&
    !props.isResizing
  ) {
    return null;
  }

  /*
  When the parent offsets are not updated, we don't need to show the dropzone, as the dropzone
  will be rendered at an incorrect coordinates.
  We can be sure that the parent offset has been calculated
  when the coordiantes are not [0,0].
  */

  return (
    <WrappedDragLayer
      columnWidth={props.parentColumnWidth}
      noPad={props.noPad}
      ref={dropTargetMask}
      rowHeight={props.parentRowHeight}
    />
  );
}
export default DragLayerComponent;
