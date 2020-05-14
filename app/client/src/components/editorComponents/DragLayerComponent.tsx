import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  RefObject,
  useRef,
} from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";
import { noCollision, currentDropRow } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
import { DropTargetContext } from "./DropTargetComponent";
import { scrollElementIntoParentCanvasView } from "utils/helpers";
import { getNearestParentCanvas } from "utils/generators";

const WrappedDragLayer = styled.div<{
  columnWidth: number;
  rowHeight: number;
  ref: RefObject<HTMLDivElement>;
}>`
  position: absolute;
  pointer-events: none;
  left: 0;
  top: 0;
  left: ${CONTAINER_GRID_PADDING}px;
  top: ${CONTAINER_GRID_PADDING}px;
  height: calc(100% - ${CONTAINER_GRID_PADDING}px);
  width: calc(100% - ${CONTAINER_GRID_PADDING}px);

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
  canDropTargetExtend: boolean;
  parentColumnWidth: number;
  visible: boolean;
  occupiedSpaces?: OccupiedSpace[];
  onBoundsUpdate: Function;
  isOver: boolean;
  parentRows?: number;
  parentCols?: number;
  isResizing?: boolean;
  parentWidgetId: string;
  force: boolean;
};

const DragLayerComponent = (props: DragLayerProps) => {
  const { updateDropTargetRows } = useContext(DropTargetContext);
  const dropTargetMask: RefObject<HTMLDivElement> = React.useRef(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dropZoneRef.current;
    const scrollParent: Element | null = getNearestParentCanvas(
      dropTargetMask.current,
    );
    if (dropTargetMask.current) {
      if (el && props.canDropTargetExtend) {
        scrollElementIntoParentCanvasView(el, scrollParent);
      }
    }
  });

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
    currentOffset &&
    props.isOver &&
    props.canDropTargetExtend &&
    isDragging
  ) {
    const row = currentDropRow(
      props.parentRowHeight,
      dropTargetOffset.current.y,
      currentOffset.y,
      widget,
    );

    updateDropTargetRows && updateDropTargetRows(widget.widgetId, row);
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
            ref={dropZoneRef}
          />
        )}
    </WrappedDragLayer>
  );
};
export default DragLayerComponent;
