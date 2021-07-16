import { getSnappedXY } from "components/editorComponents/Dropzone";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { debounce, defer, throttle } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasDraggingArena";
import { useEffect } from "react";
import { getNearestParentCanvas } from "utils/generators";
import { noCollision } from "utils/WidgetPropsUtils";
import { useWidgetDragResize } from "./dragResizeHooks";
import {
  useBlocksToBeDraggedOnCanvas,
  WidgetDraggingBlock,
} from "./useBlocksToBeDraggedOnCanvas";
import { useCanvasDragToScroll } from "./useCanvasDragToScroll";

export const useCanvasDragging = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  {
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  }: CanvasDraggingArenaProps,
) => {
  const {
    blocksToDraw,
    defaultHandlePositions,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isResizing,
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    updateRows,
  } = useBlocksToBeDraggedOnCanvas({
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  });
  const {
    setDraggingCanvas,
    setDraggingNewWidget,
    setDraggingState,
  } = useWidgetDragResize();
  const scrollParent: Element | null = getNearestParentCanvas(
    canvasRef.current,
  );
  const canScroll = useCanvasDragToScroll(
    canvasRef,
    isCurrentDraggedCanvas,
    isDragging,
    snapRows,
  );
  useEffect(() => {
    if (
      canvasRef.current &&
      !isResizing &&
      isDragging &&
      blocksToDraw.length > 0
    ) {
      const { devicePixelRatio: scale = 1 } = window;

      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let animationFrameId: number;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      const scrollObj: any = {};

      const resetCanvasState = () => {
        if (canvasRef.current) {
          const { height, width } = canvasRef.current.getBoundingClientRect();
          const canvasCtx: any = canvasRef.current.getContext("2d");
          canvasCtx.clearRect(0, 0, width * scale, height * scale);
          canvasRef.current.style.zIndex = "";
          canvasIsDragging = false;
        }
      };
      if (isDragging) {
        const startPoints = defaultHandlePositions;
        const onMouseUp = () => {
          if (isDragging && canvasIsDragging) {
            onDrop(currentRectanglesToDraw);
          }
          startPoints.top = defaultHandlePositions.top;
          startPoints.left = defaultHandlePositions.left;
          resetCanvasState();
          if (isCurrentDraggedCanvas) {
            if (isNewWidget) {
              setDraggingNewWidget(false, undefined);
            } else {
              setDraggingState(false);
            }
            setDraggingCanvas();
          }
        };

        const onFirstMoveOnCanvas = (e: any) => {
          if (
            !isResizing &&
            isDragging &&
            !canvasIsDragging &&
            canvasRef.current
          ) {
            if (!isNewWidget) {
              startPoints.left = relativeStartPoints.left;
              startPoints.top = relativeStartPoints.top;
            }
            if (!isCurrentDraggedCanvas) {
              // we can just use canvasIsDragging but this is needed to render the relative DragLayerComponent
              setDraggingCanvas(widgetId);
            }
            canvasIsDragging = true;
            canvasRef.current.style.zIndex = "2";
            onMouseMove(e);
          }
        };
        const onMouseMove = (e: any, scroll = false) => {
          if (isDragging && canvasIsDragging && canvasRef.current) {
            const delta = {
              left: e.offsetX - startPoints.left - parentDiff.left,
              top: e.offsetY - startPoints.top - parentDiff.top,
            };

            const drawingBlocks = blocksToDraw.map((each) => ({
              ...each,
              left: each.left + delta.left,
              top: each.top + delta.top,
            }));
            const newRows = updateRows(drawingBlocks, rowRef.current);
            const rowDelta = newRows ? newRows - rowRef.current : 0;
            rowRef.current = newRows ? newRows : rowRef.current;
            currentRectanglesToDraw = drawingBlocks.map((each) => ({
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
            if (rowDelta && canvasRef.current) {
              isUpdatingRows = true;
              renderNewRows(delta);
              canScroll.current = false;
            } else if (!isUpdatingRows) {
              renderBlocks();
            }
            scrollObj.lastMouseMoveEvent = e;
            scrollObj.lastScrollTop = scrollParent?.scrollTop;
            scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
          } else {
            onFirstMoveOnCanvas(e);
          }
        };
        const renderNewRows = debounce((delta) => {
          isUpdatingRows = true;
          if (canvasRef.current) {
            const canvasCtx: any = canvasRef.current.getContext("2d");

            currentRectanglesToDraw = blocksToDraw.map((each) => {
              return {
                ...each,
                left: each.left + delta.left,
                top: each.top + delta.top,
              };
            });
            canvasCtx.save();
            canvasRef.current.height =
              (rowRef.current * snapRowSpace +
                (widgetId === MAIN_CONTAINER_WIDGET_ID ? 200 : 0)) *
              scale;
            canvasCtx.scale(scale, scale);
            canvasCtx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height,
            );
            canvasCtx.restore();
            renderBlocks();
            endRenderRows();
          }
        });

        const endRenderRows = throttle(
          () => {
            canScroll.current = true;
            scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
            scrollObj.lastScrollTop = scrollParent?.scrollTop;
          },
          100,
          {
            leading: true,
            trailing: true,
          },
        );

        const renderBlocks = () => {
          if (canvasRef.current && isCurrentDraggedCanvas) {
            const canvasCtx: any = canvasRef.current.getContext("2d");
            const { height, width } = canvasRef.current.getBoundingClientRect();
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, width * scale, height * scale);
            isUpdatingRows = false;
            if (canvasIsDragging) {
              currentRectanglesToDraw.forEach((each) => {
                drawBlockOnCanvas(each);
              });
            }
            canvasCtx.restore();
            animationFrameId = window.requestAnimationFrame(renderBlocks);
          }
        };

        const drawBlockOnCanvas = (blockDimensions: WidgetDraggingBlock) => {
          if (canvasRef.current) {
            const canvasCtx: any = canvasRef.current.getContext("2d");
            const snappedXY = getSnappedXY(
              snapColumnSpace,
              snapRowSpace,
              {
                x: blockDimensions.left,
                y: blockDimensions.top,
              },
              {
                x: 0,
                y: 0,
              },
            );

            canvasCtx.fillStyle = `${
              blockDimensions.isNotColliding ? "rgb(104,	113,	239, 0.6)" : "red"
            }`;
            canvasCtx.fillRect(
              blockDimensions.left + (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.top + (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.width,
              blockDimensions.height,
            );
            canvasCtx.fillStyle = `${
              blockDimensions.isNotColliding ? "rgb(233, 250, 243, 0.6)" : "red"
            }`;
            const strokeWidth = 1;
            canvasCtx.setLineDash([3]);
            canvasCtx.strokeStyle = "rgb(104,	113,	239)";
            canvasCtx.strokeRect(
              snappedXY.X + strokeWidth + (noPad ? 0 : CONTAINER_GRID_PADDING),
              snappedXY.Y + strokeWidth + (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.width - strokeWidth,
              blockDimensions.height - strokeWidth,
            );
          }
        };
        const onScroll = () => {
          const {
            lastMouseMoveEvent,
            lastScrollHeight,
            lastScrollTop,
          } = scrollObj;
          if (
            lastMouseMoveEvent &&
            Number.isInteger(lastScrollHeight) &&
            Number.isInteger(lastScrollTop) &&
            scrollParent &&
            canScroll.current
          ) {
            const delta =
              scrollParent?.scrollHeight +
              scrollParent?.scrollTop -
              (lastScrollHeight + lastScrollTop);
            onMouseMove(
              {
                offsetX: lastMouseMoveEvent.offsetX,
                offsetY: lastMouseMoveEvent.offsetY + delta,
              },
              true,
            );
          }
        };
        const initializeListeners = () => {
          canvasRef.current?.addEventListener("mousemove", onMouseMove, false);
          canvasRef.current?.addEventListener("mouseup", onMouseUp, false);
          scrollParent?.addEventListener("scroll", onScroll, false);
          canvasRef.current?.addEventListener(
            "mouseover",
            onFirstMoveOnCanvas,
            false,
          );
          canvasRef.current?.addEventListener(
            "mouseout",
            resetCanvasState,
            false,
          );
          canvasRef.current?.addEventListener(
            "mouseleave",
            resetCanvasState,
            false,
          );
          document.body.addEventListener("mouseup", onMouseUp, false);
          window.addEventListener("mouseup", onMouseUp, false);
        };
        const startDragging = () => {
          if (canvasRef.current) {
            const { height, width } = canvasRef.current.getBoundingClientRect();
            canvasRef.current.width = width * scale;
            canvasRef.current.height = height * scale;
            const canvasCtx: any = canvasRef.current.getContext("2d");
            canvasCtx.scale(scale, scale);
            initializeListeners();
            if (canvasIsDragging) {
              blocksToDraw.forEach((each) => {
                drawBlockOnCanvas(each);
              });
            }
            if (isChildOfCanvas && canvasRef.current) {
              canvasRef.current.style.zIndex = "2";
            }
          }
        };
        startDragging();

        return () => {
          window.cancelAnimationFrame(animationFrameId);
          canvasRef.current?.removeEventListener("mousemove", onMouseMove);
          canvasRef.current?.removeEventListener("mouseup", onMouseUp);
          scrollParent?.removeEventListener("scroll", onScroll);
          canvasRef.current?.removeEventListener(
            "mouseover",
            onFirstMoveOnCanvas,
          );
          canvasRef.current?.removeEventListener("mouseout", resetCanvasState);
          canvasRef.current?.removeEventListener(
            "mouseleave",
            resetCanvasState,
          );
          document.body.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("mouseup", onMouseUp);
        };
      } else {
        resetCanvasState();
      }
    }
  }, [isDragging, isResizing, blocksToDraw, snapRows]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
