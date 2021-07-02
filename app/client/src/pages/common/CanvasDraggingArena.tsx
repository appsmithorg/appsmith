import { OccupiedSpace } from "constants/editorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import styled from "styled-components";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { XYCoord } from "react-dnd";
import {
  getDropZoneOffsets,
  isDropZoneOccupied,
  isWidgetOverflowingParentBounds,
  widgetOperationParams,
} from "utils/WidgetPropsUtils";
import { getSnappedXY } from "components/editorComponents/Dropzone";
import { getNearestParentCanvas } from "utils/generators";
import { scrollElementIntoParentCanvasView2 } from "utils/helpers";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { getWidgets } from "sagas/selectors";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { debounce, throttle } from "lodash";

const StyledSelectionCanvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(
    100% +
      ${(props) =>
        props.id === "canvas-dragging-0"
          ? props.theme.canvasBottomPadding
          : 0}px
  );
  width: 100%;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  overflow-y: auto;
`;

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

const noCollision = (
  clientOffset: XYCoord,
  colWidth: number,
  rowHeight: number,
  dropTargetOffset: XYCoord,
  widgetWidth: number,
  widgetHeight: number,
  widgetId: string,
  occupiedSpaces?: OccupiedSpace[],
  rows?: number,
  cols?: number,
): boolean => {
  if (clientOffset && dropTargetOffset) {
    // if (widget.detachFromLayout) {
    //   return true;
    // }
    const [left, top] = getDropZoneOffsets(
      colWidth,
      rowHeight,
      clientOffset as XYCoord,
      dropTargetOffset,
    );
    if (left < 0 || top < 0) {
      return false;
    }
    const currentOffset = {
      left,
      right: left + widgetWidth,
      top,
      bottom: top + widgetHeight,
    };
    return (
      !isDropZoneOccupied(currentOffset, widgetId, occupiedSpaces) &&
      !isWidgetOverflowingParentBounds({ rows, cols }, currentOffset)
    );
  }
  return false;
};

export function CanvasDraggingArena({
  // childWidgets,
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: {
  // childWidgets: string[];
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  widgetId: string;
}) {
  const dragParent = useSelector(
    (state: AppState) => state.ui.widgetDragResize.dragParent,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const selectedWidgets = useSelector(getSelectedWidgets);
  const occupiedSpaces = useSelector(getOccupiedSpaces) || {};
  const childrenOccupiedSpaces: OccupiedSpace[] =
    occupiedSpaces[dragParent] || [];
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const newWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.newWidget,
  );
  const allWidgets = useSelector(getWidgets);
  // const widget = useSelector((state: AppState) => getWidget(state, widgetId));
  const dragCenter = useSelector(
    (state: AppState) => state.ui.widgetDragResize.dragCenter,
  );
  const dragCenterSpace = childrenOccupiedSpaces.find(
    (each) => each.id === dragCenter,
  );
  const rectanglesToDraw = !newWidget
    ? childrenOccupiedSpaces
        .filter((each) => selectedWidgets.includes(each.id))
        .map((each) => ({
          top: each.top * snapRowSpace + (noPad ? 0 : CONTAINER_GRID_PADDING),
          left:
            each.left * snapColumnSpace + (noPad ? 0 : CONTAINER_GRID_PADDING),
          width: (each.right - each.left) * snapColumnSpace,
          height: (each.bottom - each.top) * snapRowSpace,
          columnWidth: each.right - each.left,
          rowHeight: each.bottom - each.top,
          widgetId: each.id,
          isNotColliding: true,
        }))
    : [
        {
          top: 0,
          left: 0,
          width: newWidget.columns * snapColumnSpace,
          height: newWidget.rows * snapRowSpace,
          columnWidth: newWidget.columns,
          rowHeight: newWidget.rows,
          widgetId: newWidget.widgetId,
          isNotColliding: true,
        },
      ];
  const { setDraggingNewWidget, setIsDragging } = useWidgetDragResize();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { persistDropTargetRows, updateDropTargetRows } = useContext(
    DropTargetContext,
  );

  const scrollToKeepUp = (
    drawingBlocks: {
      left: number;
      top: number;
      width: number;
      height: number;
      columnWidth: number;
      rowHeight: number;
      widgetId: string;
    }[],
  ) => {
    if (isDragging) {
      let groupBlock;
      if (drawingBlocks.length > 1) {
        const sortedByTopBlocks = drawingBlocks.sort(
          (each2, each1) => each2.top - each1.top,
        );
        const topMostBlock = sortedByTopBlocks[0];
        const sortedByBottomBlocks = drawingBlocks.sort(
          (each1, each2) =>
            each2.top + each2.height - (each1.top + each1.height),
        );
        const bottomMostBlock = sortedByBottomBlocks[0];
        groupBlock = {
          top: topMostBlock.top,
          height:
            bottomMostBlock.top - topMostBlock.top + bottomMostBlock.height,
        };
      } else {
        const block = drawingBlocks[0];
        groupBlock = {
          top: block.top,
          height: block.height,
        };
      }

      // const el = canvasRef?.current;
      const scrollParent: Element | null = getNearestParentCanvas(
        canvasRef.current,
      );
      if (canvasRef.current) {
        // if (el && props.canDropTargetExtend) {
        if (groupBlock) {
          scrollElementIntoParentCanvasView2(
            groupBlock,
            scrollParent,
            canvasRef.current,
          );
        }
      }
    }
  };

  const updateRows = (
    drawingBlocks: {
      left: number;
      top: number;
      width: number;
      height: number;
      columnWidth: number;
      rowHeight: number;
      widgetId: string;
    }[],
    rows: number,
  ) => {
    const sortedByTopBlocks = drawingBlocks.sort(
      (each1, each2) => each2.top + each2.height - (each1.top + each1.height),
    );
    const bottomMostBlock = sortedByTopBlocks[0];
    const [, top] = getDropZoneOffsets(
      snapColumnSpace,
      snapRowSpace,
      {
        x: bottomMostBlock.left,
        y: bottomMostBlock.top + bottomMostBlock.height,
      } as XYCoord,
      { x: 0, y: 0 },
    );
    // const snappedXY = getSnappedXY(
    //   snapColumnSpace,
    //   snapRowSpace,
    //   {
    //     x: bottomMostBlock.left,
    //     y: bottomMostBlock.top + bottomMostBlock.height,
    //   },
    //   {
    //     x: currentOffset?.x || 0,
    //     y: currentOffset?.y || 0,
    //   },
    // );
    // const canvasTopBound = canvasRef?.current?.getBoundingClientRect().top || 0;

    // const row = currentDropRow(
    //   snapRowSpace,
    //   snappedXY.Y,
    //   currentOffset?.y || 0,
    //   widget,
    // );
    // const bottomMostRow = bottomMostBlock.top + bottomMostBlock.height;
    console.log({ drawingBlocks, bottomMostBlock, top });
    // const newRows = calculateDropTargetRows(
    //   widgetId,
    //   top,
    //   minHeight / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
    //   occupiedSpaces[widgetId],
    // );

    // if (snapRows < newRows) {
    //   // setRows(newRows);
    //   return newRows;
    // }
    if (top > rows) {
      return updateDropTargetRows && updateDropTargetRows(widgetId, top);
    }
  };
  const { updateWidget } = useContext(EditorContext);

  const onDrop = (
    drawingBlocks: {
      left: number;
      top: number;
      width: number;
      height: number;
      columnWidth: number;
      rowHeight: number;
      widgetId: string;
      isNotColliding: boolean;
    }[],
  ) => {
    const cannotDrop = drawingBlocks.some((each) => {
      return !each.isNotColliding;
    });
    if (!cannotDrop) {
      drawingBlocks
        .sort(
          (each1, each2) =>
            each1.top + each1.height - (each2.top + each2.height),
        )
        .forEach((each) => {
          const widget = newWidget ? newWidget : allWidgets[each.widgetId];
          const updateWidgetParams = widgetOperationParams(
            widget,
            { x: each.left, y: each.top },
            { x: 0, y: 0 },
            snapColumnSpace,
            snapRowSpace,
            widget.detachFromLayout ? MAIN_CONTAINER_WIDGET_ID : widgetId,
          );

          // const widgetBottomRow = getWidgetBottomRow(widget, updateWidgetParams);
          const widgetBottomRow =
            updateWidgetParams.payload.topRow +
            (updateWidgetParams.payload.rows ||
              widget.bottomRow - widget.topRow);
          persistDropTargetRows &&
            persistDropTargetRows(widget.widgetId, widgetBottomRow);

          /* Finally update the widget */
          updateWidget &&
            updateWidget(
              updateWidgetParams.operation,
              updateWidgetParams.widgetId,
              updateWidgetParams.payload,
            );
        });
    }
  };

  useEffect(() => {
    if (isDragging && canvasRef.current && !isResizing) {
      let rows = snapRows;
      let canvasIsDragging = false;
      const scale = 1;

      // draggingCanvas.style.padding = `${noPad ? 0 : CONTAINER_GRID_PADDING}px`;
      const { height, width } = canvasRef.current.getBoundingClientRect();
      canvasRef.current.width = width * scale;
      canvasRef.current.height = height * scale;
      const differentParent = dragParent !== widgetId;
      const parentDiff = {
        top:
          differentParent && dragCenterSpace
            ? dragCenterSpace.top * snapRowSpace +
              (noPad ? 0 : CONTAINER_GRID_PADDING)
            : noPad
            ? 0
            : CONTAINER_GRID_PADDING,
        left:
          differentParent && dragCenterSpace
            ? dragCenterSpace.left * snapColumnSpace +
              (noPad ? 0 : CONTAINER_GRID_PADDING)
            : noPad
            ? 0
            : CONTAINER_GRID_PADDING,
      };
      let newRectanglesToDraw: {
        top: number;
        left: number;
        width: number;
        height: number;
        columnWidth: number;
        rowHeight: number;
        widgetId: string;
        isNotColliding: boolean;
      }[] = [];
      let canvasCtx: any = canvasRef.current.getContext("2d");
      canvasCtx.globalCompositeOperation = "destination-over";
      // const drawDragLayer = debounce(
      //   (rows) => {
      //     if (canvasRef.current && canvasDragLayerRef.current) {
      //       const { height, width } = canvasRef.current.getBoundingClientRect();
      //       canvasDragLayerRef.current.width = width * scale;
      //       canvasDragLayerRef.current.height = height * scale;
      //       const canvasCtx: any = canvasDragLayerRef.current.getContext("2d");
      //       canvasCtx.clearRect(0, 0, width, height);
      //       canvasCtx.beginPath(); // clear path if it has been used previously
      //       // modify method to add to path instead
      //       const draw = (x: any, y: any, width: any, height: any) => {
      //         canvasCtx.fillStyle = `${"rgb(0, 0, 0, 1)"}`;
      //         canvasCtx.strokeStyle = `${"rgb(0, 0, 0, 1)"}`;
      //         canvasCtx.rect(x, y, width, height);
      //       };
      //       for (
      //         let x = noPad ? 0 : CONTAINER_GRID_PADDING;
      //         x < width;
      //         x += snapColumnSpace
      //       ) {
      //         for (
      //           let y = noPad ? 0 : CONTAINER_GRID_PADDING;
      //           y < rows * snapRowSpace + (widgetId === "0" ? 200 : 0);
      //           y += snapRowSpace
      //         ) {
      //           draw(x, y, 1, 1);
      //         }
      //       }

      //       // when done, fill once
      //       canvasCtx.fill();
      //     }
      //   },
      //   0,
      //   {
      //     leading: true,
      //     trailing: true,
      //   },
      // );
      // canvasCtx.scale(scale, scale);

      const startPoints = {
        left: 20,
        top: 20,
      };
      const onMouseUp = () => {
        startPoints.left = 20;
        startPoints.top = 20;
        if (newWidget) {
          setDraggingNewWidget(false, undefined);
        } else {
          setIsDragging(false);
        }
        onMouseOut();
        if (isDragging && canvasIsDragging) {
          onDrop(newRectanglesToDraw);
        }
      };
      const onMouseOut = () => {
        if (canvasRef.current) {
          const { height, width } = canvasRef.current.getBoundingClientRect();
          canvasRef.current.style.zIndex = "";
          canvasCtx.clearRect(0, 0, width, height);
          canvasIsDragging = false;
        }
      };
      const onMouseDown = (e: any) => {
        if (
          !isResizing &&
          isDragging &&
          !canvasIsDragging &&
          canvasRef.current
        ) {
          canvasIsDragging = true;
          if (
            dragParent === widgetId &&
            startPoints.left === 20 &&
            startPoints.top === 20
          ) {
            startPoints.left = e.offsetX;
            startPoints.top = e.offsetY;
          }
          canvasRef.current.style.zIndex = "2";
          // drawDragLayer(rows);
        }
      };
      const onMouseMove = (e: any) => {
        if (canvasIsDragging && canvasRef.current) {
          // console.log(startPoints, e.offsetX, draggingCanvas.offsetLeft);

          const diff = {
            left: e.offsetX - startPoints.left - parentDiff.left,
            top: e.offsetY - startPoints.top - parentDiff.top,
          };
          const currentOccSpaces = occupiedSpaces[widgetId];
          const occSpaces: OccupiedSpace[] =
            dragParent === widgetId
              ? childrenOccupiedSpaces.filter(
                  (each) => !selectedWidgets.includes(each.id),
                )
              : currentOccSpaces;
          const drawingBlocks = rectanglesToDraw.map((each) => ({
            ...each,
            left: each.left + diff.left,
            top: each.top + diff.top,
          }));
          const newRows = updateRows(drawingBlocks, rows);
          const rowDiff = newRows ? newRows - rows : 0;
          rows = newRows && newRows !== rows ? newRows : rows;
          newRectanglesToDraw = drawingBlocks.map((each) => ({
            ...each,
            isNotColliding: noCollision(
              { x: each.left, y: each.top },
              snapColumnSpace,
              snapRowSpace,
              { x: 0, y: 0 },
              each.columnWidth,
              each.rowHeight,
              each.widgetId,
              occSpaces,
              rows,
              GridDefaults.DEFAULT_GRID_COLUMNS,
            ),
          }));
          if (rowDiff && canvasRef.current) {
            notDoneYet = true;
            drawInit(rowDiff, diff);
          } else if (!notDoneYet) {
            const { height, width } = canvasRef.current.getBoundingClientRect();
            canvasCtx.clearRect(0, 0, width, height);
            newRectanglesToDraw.forEach((each) => {
              drawRectangle(each);
            });
          }
          // if (rowDiff) {
          //   newRectanglesToDraw = newRectanglesToDraw.map((each) => {
          //     return {
          //       ...each,
          //       top: each.top - (rows - snapRows) * snapRowSpace,
          //     };
          //   });
          //   console.log({ rowDiff, rectanglesToDraw, newRectanglesToDraw });
          // }

          scrollToKeepUp(newRectanglesToDraw);
        } else {
          onMouseDown(e);
        }
      };
      console.log("I am initiated again");
      let notDoneYet = false;
      const drawInit = throttle(
        debounce(
          (rowDiff, diff) => {
            console.count("drawInit");
            notDoneYet = true;
            if (canvasRef.current) {
              newRectanglesToDraw = rectanglesToDraw.map((each) => {
                return {
                  ...each,
                  left: each.left + diff.left,
                  top: each.top + diff.top,
                };
              });

              canvasRef.current.height =
                (rows * snapRowSpace + (widgetId === "0" ? 200 : 0)) * scale;
              canvasCtx = canvasRef.current.getContext("2d");
              const {
                height,
                width,
              } = canvasRef.current.getBoundingClientRect();
              // drawDragLayer(rows);

              canvasCtx.clearRect(0, 0, width, height);
              notDoneYet = false;
              newRectanglesToDraw.forEach((each) => {
                drawRectangle(each);
              });
              // scrollToKeepUp(newRectanglesToDraw);
            }
          },
          10,
          {
            leading: false,
            trailing: true,
          },
        ),
        10,
        {
          leading: false,
          trailing: true,
        },
      );

      // const drawInit = debounce(
      //   (rowDiff, diff, occSpaces) => {
      //     // // if (rowDiff) {
      //     // drawDragLayer();
      //     // // }
      //     if (rowDiff) {
      //       // startPoints.top = startPoints.top + rowDiff * snapRowSpace;
      //       newRectanglesToDraw = rectanglesToDraw.map((each) => {
      //         return {
      //           ...each,
      //           top: each.top + rowDiff * snapRowSpace
      //         };
      //       });
      //     }

      //     scrollToKeepUp(newRectanglesToDraw);
      //   },
      //   100,
      //   {
      //     leading: true,
      //     trailing: true,
      //   },
      // );
      const drawRectangle = (selectionDimensions: {
        top: number;
        left: number;
        width: number;
        height: number;
        columnWidth: number;
        rowHeight: number;
        widgetId: string;
        isNotColliding: boolean;
      }) => {
        if (canvasRef.current) {
          const canvasCtx: any = canvasRef.current.getContext("2d");
          const snappedXY = getSnappedXY(
            snapColumnSpace,
            snapRowSpace,
            {
              x: selectionDimensions.left,
              y: selectionDimensions.top,
            },
            {
              x: 0,
              y: 0,
            },
          );

          canvasCtx.fillStyle = `${
            selectionDimensions.isNotColliding ? "rgb(104,	113,	239, 0.6)" : "red"
          }`;
          canvasCtx.fillRect(
            selectionDimensions.left + (noPad ? 0 : CONTAINER_GRID_PADDING),
            selectionDimensions.top + (noPad ? 0 : CONTAINER_GRID_PADDING),
            selectionDimensions.width,
            selectionDimensions.height,
          );
          canvasCtx.fillStyle = `${
            selectionDimensions.isNotColliding
              ? "rgb(233, 250, 243, 0.6)"
              : "red"
          }`;
          const strokeWidth = 1;
          canvasCtx.setLineDash([3]);
          canvasCtx.strokeStyle = "rgb(104,	113,	239)";
          canvasCtx.strokeRect(
            snappedXY.X + strokeWidth + (noPad ? 0 : CONTAINER_GRID_PADDING),
            snappedXY.Y + strokeWidth + (noPad ? 0 : CONTAINER_GRID_PADDING),
            selectionDimensions.width - strokeWidth,
            selectionDimensions.height - strokeWidth,
          );
        }
      };
      const startDragging = () => {
        canvasRef.current?.addEventListener("mousemove", onMouseMove, false);
        canvasRef.current?.addEventListener("mouseup", onMouseUp, false);
        canvasRef.current?.addEventListener("mouseover", onMouseDown, false);
        canvasRef.current?.addEventListener("mouseout", onMouseOut, false);

        if (canvasIsDragging) {
          // fix_dpi();
          // drawDragLayer(rows);
          rectanglesToDraw.forEach((each) => {
            drawRectangle(each);
          });
        }
      };
      startDragging();
      if (dragParent === widgetId) {
        canvasRef.current.style.zIndex = "2";
      }
      return () => {
        canvasRef.current?.removeEventListener("mousemove", onMouseMove);
        canvasRef.current?.removeEventListener("mouseup", onMouseUp);
        canvasRef.current?.removeEventListener("mouseenter", onMouseDown);
        canvasRef.current?.removeEventListener("mouseleave", onMouseOut);
      };
    }
  }, [isDragging, newWidget, isResizing]);
  return isDragging && !isResizing ? (
    <StyledSelectionCanvas
      data-testid={`canvas-dragging-${widgetId}`}
      id={`canvas-dragging-${widgetId}`}
      ref={canvasRef}
    />
  ) : null;
}
CanvasDraggingArena.whyDidYouRender = {
  logOnDifferentValues: true,
};
CanvasDraggingArena.displayName = "CanvasDraggingArena";
