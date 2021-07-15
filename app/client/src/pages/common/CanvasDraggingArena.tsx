import { OccupiedSpace } from "constants/editorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import React, { useContext, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import styled from "styled-components";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { XYCoord } from "react-dnd";
import {
  getDropZoneOffsets,
  noCollision,
  widgetOperationParams,
} from "utils/WidgetPropsUtils";
import { getSnappedXY } from "components/editorComponents/Dropzone";
import { getNearestParentCanvas } from "utils/generators";
import { getScrollByPixels } from "utils/helpers";
import { DropTargetContext } from "components/editorComponents/DropTargetComponent";
import { getWidgets } from "sagas/selectors";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { debounce, isEmpty } from "lodash";

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

export function CanvasDraggingArena({
  noPad,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: {
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  widgetId: string;
}) {
  const dragParent = useSelector(
    (state: AppState) => state.ui.widgetDragResize.dragGroupActualParent,
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
  const draggedOn = useSelector(
    (state: AppState) => state.ui.widgetDragResize.draggedOn,
  );
  const dragStartPoints = useSelector(
    (state: AppState) => state.ui.widgetDragResize.startPoints,
  );
  const newWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.newWidget,
  );
  const allWidgets = useSelector(getWidgets);
  const dragCenter = useSelector(
    (state: AppState) => state.ui.widgetDragResize.draggingGroupCenter,
  );

  const dragCenterSpace: any =
    dragCenter && dragCenter.widgetId
      ? childrenOccupiedSpaces.find(
          (each) => each.id === dragCenter.widgetId,
        ) || {}
      : dragCenter &&
        Number.isInteger(dragCenter.top) &&
        Number.isInteger(dragCenter.left)
      ? dragCenter
      : {};
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
  const {
    setDraggingCanvas,
    setDraggingNewWidget,
    setDraggingState,
  } = useWidgetDragResize();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const { persistDropTargetRows, updateDropTargetRows } = useContext(
    DropTargetContext,
  );

  const rowRef = useRef(snapRows);
  useEffect(() => {
    rowRef.current = snapRows;
  }, [snapRows, isDragging]);

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
    if (drawingBlocks.length) {
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
      if (top > rows - GridDefaults.CANVAS_EXTENSION_OFFSET) {
        return updateDropTargetRows && updateDropTargetRows(widgetId, top);
      }
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
    if (canvasRef.current && !isResizing && rectanglesToDraw.length > 0) {
      const { devicePixelRatio: scale = 1 } = window;

      let canvasIsDragging = false;
      let notDoneYet = false;
      let animationFrameId: number;
      let scrollTimeOut: number[] = [];
      let scrollDirection = 0;
      let scrollByPixels = 0;
      const scrollFn = (scrollParent: Element | null) => {
        if (isDragging && draggedOn === widgetId && scrollParent) {
          if (scrollByPixels < 0 && scrollParent.scrollTop > 0) {
            scrollParent.scrollBy({
              top: scrollByPixels,
              behavior: "smooth",
            });
          }
          if (scrollByPixels > 0) {
            scrollParent.scrollBy({
              top: scrollByPixels,
              behavior: "smooth",
            });
          }
          if (scrollTimeOut.length) {
            scrollTimeOut.forEach((each) => {
              clearTimeout(each);
            });
            scrollTimeOut = [];
          }
          scrollTimeOut.push(setTimeout(() => scrollFn(scrollParent), 100));
        } else {
          if (scrollTimeOut.length) {
            scrollTimeOut.forEach((each) => {
              clearTimeout(each);
            });
            scrollTimeOut = [];
          }
        }
      };
      const checkIfNeedsScroll = debounce((e: any) => {
        if (isDragging && canvasIsDragging && draggedOn === widgetId) {
          const scrollParent: Element | null = getNearestParentCanvas(
            canvasRef.current,
          );
          if (canvasRef.current && scrollParent) {
            scrollByPixels = getScrollByPixels(
              {
                top: e.offsetY,
                height: 0,
              },
              scrollParent,
              canvasRef.current,
            );
            const currentScrollDirection = scrollByPixels
              ? scrollByPixels > 0
                ? 1
                : -1
              : 0;
            if (currentScrollDirection !== scrollDirection) {
              scrollDirection = currentScrollDirection;
              if (scrollTimeOut.length) {
                scrollTimeOut.forEach((each) => {
                  clearTimeout(each);
                });
                scrollTimeOut = [];
              }
              if (!!scrollDirection) {
                scrollFn(scrollParent);
              }
            }
          }
        }
      });
      const onMouseOut = () => {
        if (canvasRef.current) {
          if (scrollTimeOut.length) {
            scrollTimeOut.forEach((each) => {
              clearTimeout(each);
            });
            scrollTimeOut = [];
          }
          const { height, width } = canvasRef.current.getBoundingClientRect();
          const canvasCtx: any = canvasRef.current.getContext("2d");
          canvasCtx.clearRect(0, 0, width * scale, height * scale);
          canvasRef.current.style.zIndex = "";
          scrollDirection = 0;
          canvasIsDragging = false;
        }
      };
      if (isDragging) {
        const { height, width } = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = width * scale;
        canvasRef.current.height = height * scale;

        const differentParent = dragParent !== widgetId;
        const parentDiff = {
          top:
            differentParent && !isEmpty(dragCenterSpace)
              ? dragCenterSpace.top * snapRowSpace +
                (noPad ? 0 : CONTAINER_GRID_PADDING)
              : noPad
              ? 0
              : CONTAINER_GRID_PADDING,
          left:
            differentParent && !isEmpty(dragCenterSpace)
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
        const canvasCtx: any = canvasRef.current.getContext("2d");
        canvasCtx.globalCompositeOperation = "destination-over";
        canvasCtx.scale(scale, scale);

        const startPoints = {
          left: 20,
          top: 20,
        };
        const onMouseUp = () => {
          if (isDragging && canvasIsDragging) {
            onDrop(newRectanglesToDraw);
          }
          if (scrollTimeOut.length) {
            scrollTimeOut.forEach((each) => {
              clearTimeout(each);
            });
            scrollTimeOut = [];
          }
          startPoints.left = 20;
          startPoints.top = 20;
          const wasCanvasDragging = canvasIsDragging;
          onMouseOut();
          if (wasCanvasDragging) {
            if (newWidget) {
              setDraggingNewWidget(false, undefined);
            } else {
              setDraggingState(false);
            }
            setDraggingCanvas();
          }
        };

        const onMouseDown = (e: any) => {
          if (
            !isResizing &&
            isDragging &&
            !canvasIsDragging &&
            canvasRef.current
          ) {
            if (!isEmpty(dragCenterSpace)) {
              startPoints.left =
                ((dragParent === widgetId ? dragCenterSpace.left : 0) +
                  dragStartPoints.left) *
                  snapColumnSpace +
                (noPad ? 0 : 2 * CONTAINER_GRID_PADDING);
              startPoints.top =
                ((dragParent === widgetId ? dragCenterSpace.top : 0) +
                  dragStartPoints.top) *
                  snapRowSpace +
                (noPad ? 0 : 2 * CONTAINER_GRID_PADDING);
            }
            if (draggedOn !== widgetId) {
              setDraggingCanvas(widgetId);
            }
            canvasIsDragging = true;
            canvasRef.current.style.zIndex = "2";
            onMouseMove(e);
          }
        };
        const onMouseMove = (e: any) => {
          if (isDragging && canvasIsDragging && canvasRef.current) {
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
            const newRows = updateRows(drawingBlocks, rowRef.current);
            const rowDiff = newRows ? newRows - rowRef.current : 0;
            rowRef.current = newRows ? newRows : rowRef.current;
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
                rowRef.current,
                GridDefaults.DEFAULT_GRID_COLUMNS,
              ),
            }));
            if (rowDiff && canvasRef.current) {
              notDoneYet = true;
              drawInit(rowDiff, diff);
            } else if (!notDoneYet) {
              drawBlocks();
            }
            checkIfNeedsScroll(e);
          } else {
            onMouseDown(e);
          }
        };
        const drawInit = debounce((rowDiff, diff) => {
          notDoneYet = true;
          if (canvasRef.current) {
            newRectanglesToDraw = rectanglesToDraw.map((each) => {
              return {
                ...each,
                left: each.left + diff.left,
                top: each.top + diff.top,
              };
            });
            canvasCtx.save();
            canvasRef.current.height =
              (rowRef.current * snapRowSpace + (widgetId === "0" ? 200 : 0)) *
              scale;
            canvasCtx.scale(scale, scale);
            canvasCtx.clearRect(0, 0, width, canvasRef.current.height);
            canvasCtx.restore();
            drawBlocks();
          }
        });

        const drawBlocks = () => {
          if (canvasRef.current && draggedOn === widgetId) {
            const canvasCtx: any = canvasRef.current.getContext("2d");
            const { height, width } = canvasRef.current.getBoundingClientRect();
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, width * scale, height * scale);
            notDoneYet = false;
            if (canvasIsDragging) {
              newRectanglesToDraw.forEach((each) => {
                drawRectangle(each);
              });
            }
            canvasCtx.restore();
            animationFrameId = window.requestAnimationFrame(drawBlocks);
          }
        };

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
              selectionDimensions.isNotColliding
                ? "rgb(104,	113,	239, 0.6)"
                : "red"
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
          canvasRef.current?.addEventListener("mouseleave", onMouseOut, false);
          document.body.addEventListener("mouseup", onMouseUp, false);
          window.addEventListener("mouseup", onMouseUp, false);

          if (canvasIsDragging) {
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
          if (scrollTimeOut.length) {
            scrollTimeOut.forEach((each) => {
              clearTimeout(each);
            });
            scrollTimeOut = [];
          }
          window.cancelAnimationFrame(animationFrameId);
          canvasRef.current?.removeEventListener("mousemove", onMouseMove);
          canvasRef.current?.removeEventListener("mouseup", onMouseUp);
          canvasRef.current?.removeEventListener("mouseover", onMouseDown);
          canvasRef.current?.removeEventListener("mouseout", onMouseOut);
          canvasRef.current?.removeEventListener("mouseleave", onMouseOut);
          document.body.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("mouseup", onMouseUp);
        };
      } else {
        onMouseOut();
      }
    }
  }, [isDragging, newWidget, isResizing, rectanglesToDraw, snapRows]);

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
