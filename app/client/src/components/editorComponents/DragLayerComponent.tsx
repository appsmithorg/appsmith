import React, { useContext, useEffect, RefObject, useRef } from "react";
import styled from "styled-components";
import { useDragLayer, XYCoord } from "react-dnd";
import DropZone from "./Dropzone";
import { noCollision, currentDropRow } from "utils/WidgetPropsUtils";
import { OccupiedSpace } from "constants/editorConstants";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
import { DropTargetContext } from "./DropTargetComponent";
import { scrollElementIntoParentCanvasView } from "utils/helpers";
import { getNearestParentCanvas } from "utils/generators";
import { getWidget } from "sagas/selectors";
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
  console.log(props.parentWidgetId, diffOffset);

  // let widgetWidth = 0;
  // let widgetHeight = 0;
  // if (widget) {
  //   widgetWidth = widget.columns
  //     ? widget.columns
  //     : widget.rightColumn - widget.leftColumn;
  //   widgetHeight = widget.rows ? widget.rows : widget.bottomRow - widget.topRow;
  // }
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
  // const isParentOffsetCalculated = dropTargetOffset.current.x !== 0;
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
              currentOffset={currentOffset}
              diffOffset={diffOffset}
              key={each}
              props={props}
              widgetId={each}
            />
          );
        })}
      {props.visible && props.isOver && (
        <WidgetPreview
          canDrop={canDrop}
          currentOffset={widget.topRow ? undefined : currentOffset}
          diffOffset={diffOffset}
          key={widget.widgetId}
          props={props}
          widget={widget}
        />
      )}
    </WrappedDragLayer>
  );
}

function SelectedWidgetPreview({
  props,
  diffOffset,
  widgetId,
}: {
  widgetId: string;
  props: DragLayerProps;
  diffOffset: XYCoord | null;
  currentOffset: XYCoord | null;
}) {
  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  return (
    <WidgetPreview diffOffset={diffOffset} props={props} widget={widget} />
  );
}

function WidgetPreview({
  props,
  diffOffset,
  widget,
  canDrop,
  currentOffset,
}: {
  props: DragLayerProps;
  diffOffset: XYCoord | null;
  widget: WidgetProps;
  canDrop?: boolean;
  currentOffset?: XYCoord | null;
}) {
  const dropZoneRef = React.useRef<HTMLDivElement>(null);
  const dropTargetOffset = useRef({
    x: 0,
    y: 0,
  });
  const isParentOffsetCalculated = dropTargetOffset.current.x !== 0;

  // const anotherOffset: XYCoord | null = currentOffset || {
  //   x: dropTargetOffset.current.x + (diffOffset?.x ?? 0),
  //   y: dropTargetOffset.current.y + (diffOffset?.y ?? 0),
  // };
  // const movingToDifferentContainer = props.parentWidgetId === widget.parentId;
  // !movingToDifferentContainer &&
  //   console.log({
  //     diffOffset,
  //     left,
  //     top,
  //     parent: props.parentWidgetId,
  //     widget,
  //     dropTargetOffset,
  //   });
  // movingToDifferentContainer &&
  //   props.parentWidgetId !== "0" &&
  //   console.log({
  //     diffOffset,
  //     left,
  //     top,
  //     parent: props.parentWidgetId,
  //     widget,
  //     dropTargetOffset,
  //   });
  const currentOffsetRef = React.useRef<XYCoord>({
    x: 0,
    y: 0,
  });
  const isCurrentOffsetCalculated = currentOffsetRef.current.x !== 0;

  const buffer = {
    x: isCurrentOffsetCalculated
      ? currentOffsetRef.current.x
      : props.parentColumnWidth * widget.leftColumn +
        dropTargetOffset.current.x,
    y: isCurrentOffsetCalculated
      ? currentOffsetRef.current.y
      : props.parentRowHeight * widget.topRow + dropTargetOffset.current.y,
  };

  // const currentOffsetRef = React.useRef(null);

  const derviedCurrentOffset: XYCoord | null = currentOffset || {
    x: buffer.x + (diffOffset?.x ?? 0),
    y: buffer.y + (diffOffset?.y ?? 0),
  };
  useEffect(() => {
    if (isParentOffsetCalculated) {
      currentOffsetRef.current = derviedCurrentOffset;
    }
  }, [props.parentWidgetId]);
  // const [left, top] = getDropZoneOffsets(
  //   props.parentColumnWidth,
  //   props.parentRowHeight,
  //   currentOffsetRef.current as XYCoord,
  //   dropTargetOffset.current,
  //   // dropTargetOffset.current,
  // );
  const dropTargetMask: RefObject<HTMLDivElement> = React.useRef(null);
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
    if (isParentOffsetCalculated && !isCurrentOffsetCalculated) {
      const currentOffset = dropZoneRef.current?.getBoundingClientRect();
      currentOffsetRef.current = {
        x: currentOffset?.left || 0,
        y: currentOffset?.top || 0,
      };
    }
    if (dropTargetMask.current) {
      if (el && props.canDropTargetExtend) {
        scrollElementIntoParentCanvasView(el, scrollParent);
      }
    }
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
  const calculateCanDrop =
    canDrop === undefined &&
    noCollision(
      derviedCurrentOffset as XYCoord,
      props.parentColumnWidth,
      props.parentRowHeight,
      widget,
      dropTargetOffset.current,
      props.occupiedSpaces,
      props.parentRows,
      props.parentCols,
    );
  // const parentOffset = currentOffset
  //   ? dropTargetOffset.current
  //   : { x: 0, y: 0 };
  return (
    <WrappedDragLayer2
      columnWidth={props.parentColumnWidth}
      ref={dropTargetMask}
      rowHeight={props.parentRowHeight}
    >
      {props.visible &&
        props.isOver &&
        derviedCurrentOffset &&
        isParentOffsetCalculated && (
          <DropZone
            canDrop={canDrop || calculateCanDrop}
            currentOffset={derviedCurrentOffset as XYCoord}
            height={widgetHeight}
            parentColumnWidth={props.parentColumnWidth}
            parentOffset={dropTargetOffset.current}
            parentRowHeight={props.parentRowHeight}
            ref={dropZoneRef}
            width={widgetWidth}
          />
        )}
    </WrappedDragLayer2>
  );
}
export default DragLayerComponent;
