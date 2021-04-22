import React, { useContext, useEffect, RefObject, useRef } from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";
import { noCollision, currentDropRow } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import {
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { DropTargetContext } from "./DropTargetComponent";
import { scrollElementIntoParentCanvasView } from "utils/helpers";
import { getNearestParentCanvas } from "utils/generators";
import { getWidget, getWidgetChildren } from "sagas/selectors";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { WidgetProps } from "widgets/BaseWidget";

const WrappedDragLayer = styled.div<{
  columnWidth: number;
  rowHeight: number;
  noPad: boolean;
  ref: RefObject<HTMLDivElement>;
}>`
  position: absolute;
  pointer-events: none;
  background-image: radial-gradient(
    circle,
    ${(props) => props.theme.colors.grid} 1px,
    transparent 0
  );
  left: 0;
  top: 0;
  left: ${CONTAINER_GRID_PADDING}px;
  top: ${CONTAINER_GRID_PADDING}px;
  height: calc(100% - ${CONTAINER_GRID_PADDING}px);
  width: calc(100% - ${CONTAINER_GRID_PADDING}px);
  background-size: ${(props) => props.columnWidth}px
    ${(props) => props.rowHeight}px;
  background-position: -${(props) => props.columnWidth / 2}px -${(props) =>
      props.rowHeight / 2}px;
`;

const WrappedDragLayer2 = styled.div<{
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
  background-size: ${(props) => props.columnWidth}px
    ${(props) => props.rowHeight}px;
  background-position: -${(props) => props.columnWidth / 2}px -${(props) =>
      props.rowHeight / 2}px;
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
  const { updateDropTargetRows } = useContext(DropTargetContext);
  const selectedWidgets = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgets,
  );
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
  const {
    isDragging,
    currentOffset,
    diffOffset,
    widget,
    canDrop,
  } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    diffOffset: monitor.getDifferenceFromInitialOffset(),
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
  console.log("1", currentOffset);

  let widgetWidth = 0;
  let widgetHeight = 0;
  if (widget) {
    widgetWidth = widget.columns
      ? widget.columns
      : widget.rightColumn - widget.leftColumn;
    widgetHeight = widget.rows ? widget.rows : widget.bottomRow - widget.topRow;
  }
  useEffect(() => {
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
  let otherSelectedWidgets;
  if (widget && widget.widgetId) {
    otherSelectedWidgets = selectedWidgets.filter(
      (each) => each !== widget.widgetId,
    );
  }
  return (
    <WrappedDragLayer
      columnWidth={props.parentColumnWidth}
      noPad={props.noPad}
      ref={dropTargetMask}
      rowHeight={props.parentRowHeight}
    >
      {props.visible &&
        props.isOver &&
        otherSelectedWidgets &&
        otherSelectedWidgets.length > 0 &&
        otherSelectedWidgets.map((each) => {
          return (
            <SelectedWidgetPreview
              key={each}
              props={props}
              widgetId={each}
              diffOffset={diffOffset}
              currentOffset={currentOffset}
            ></SelectedWidgetPreview>
          );
        })}
      {props.visible && props.isOver && (
        <WidgetPreview
          key={widget.widgetId}
          props={props}
          widget={widget}
          diffOffset={diffOffset}
          canDrop={canDrop}
        ></WidgetPreview>
      )}
    </WrappedDragLayer>
  );
};

const SelectedWidgetPreview = ({
  props,
  diffOffset,
  widgetId,
  currentOffset,
}: {
  widgetId: string;
  props: DragLayerProps;
  diffOffset: XYCoord | null;
  currentOffset: XYCoord | null;
}) => {
  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  return (
    <WidgetPreview
      props={props}
      widget={widget}
      diffOffset={diffOffset}
    ></WidgetPreview>
  );
};

const WidgetPreview = ({
  props,
  diffOffset,
  widget,
  canDrop,
}: {
  props: DragLayerProps;
  diffOffset: XYCoord | null;
  widget: WidgetProps;
  canDrop?: boolean;
}) => {
  const currentOffset: XYCoord | null = {
    x:
      props.parentColumnWidth * (widget.leftColumn || 0) + (diffOffset?.x ?? 0),
    y: props.parentRowHeight * (widget.topRow || 0) + (diffOffset?.y ?? 0),
  };
  const dropTargetMask: RefObject<HTMLDivElement> = React.useRef(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);
  let widgetWidth = 0;
  let widgetHeight = 0;
  if (widget) {
    widgetWidth = widget.columns
      ? widget.columns
      : widget.rightColumn - widget.leftColumn;
    widgetHeight = widget.rows ? widget.rows : widget.bottomRow - widget.topRow;
  }
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
  useEffect(() => {
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
  const isParentOffsetCalculated = dropTargetOffset.current.x !== 0;

  const calculateCanDrop =
    canDrop === undefined &&
    noCollision(
      currentOffset as XYCoord,
      props.parentColumnWidth,
      props.parentRowHeight,
      widget,
      { x: 0, y: 0 },
      props.occupiedSpaces,
      props.parentRows,
      props.parentCols,
    );
  return (
    <WrappedDragLayer2
      columnWidth={props.parentColumnWidth}
      rowHeight={props.parentRowHeight}
      ref={dropTargetMask}
    >
      {props.visible &&
        props.isOver &&
        currentOffset &&
        isParentOffsetCalculated && (
          <DropZone
            parentOffset={{ x: 0, y: 0 }}
            parentRowHeight={props.parentRowHeight}
            parentColumnWidth={props.parentColumnWidth}
            width={widgetWidth}
            height={widgetHeight}
            currentOffset={currentOffset as XYCoord}
            canDrop={canDrop || calculateCanDrop}
            ref={dropZoneRef}
            width={widgetWidth}
          />
        )}
    </WrappedDragLayer2>
  );
}
export default DragLayerComponent;
