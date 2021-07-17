import { getSnappedXY } from "components/editorComponents/Dropzone";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce, throttle } from "lodash";
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
  canvasRef: React.RefObject<HTMLDivElement>,
  canvasDrawRef: React.RefObject<HTMLCanvasElement>,
  {
    canExtend,
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
    canExtend,
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

  const updateCanvasPosition = () => {
    const parentCanvas: Element | null = getNearestParentCanvas(
      canvasRef.current,
    );
    if (parentCanvas && canvasDrawRef.current && canvasRef.current) {
      const { height } = parentCanvas.getBoundingClientRect();
      const { width } = canvasRef.current.getBoundingClientRect();
      canvasDrawRef.current.style.width = width + "px";
      canvasDrawRef.current.style.position = canExtend ? "absolute" : "sticky";
      canvasDrawRef.current.style.left = "0px";
      canvasDrawRef.current.style.height = height + "px";
      canvasDrawRef.current.style.top =
        (canExtend ? parentCanvas.scrollTop : 0) + "px";
    }
  };

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
      const scrollParent: Element | null = getNearestParentCanvas(
        canvasRef.current,
      );
      const { devicePixelRatio: scale = 1 } = window;
      // const scale = 1;
      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      const scrollObj: any = {};

      const resetCanvasState = () => {
        if (canvasDrawRef.current && canvasRef.current) {
          const canvasCtx: any = canvasDrawRef.current.getContext("2d");
          canvasCtx.clearRect(
            0,
            0,
            canvasDrawRef.current.width,
            canvasDrawRef.current.height,
          );
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
        const onMouseMove = (e: any) => {
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
              canScroll.current = false;
              renderNewRows(delta);
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
          if (canvasRef.current && canvasDrawRef.current) {
            const canvasCtx: any = canvasDrawRef.current.getContext("2d");

            currentRectanglesToDraw = blocksToDraw.map((each) => {
              return {
                ...each,
                left: each.left + delta.left,
                top: each.top + delta.top,
              };
            });
            canvasCtx.save();
            canvasCtx.scale(scale, scale);
            canvasCtx.clearRect(
              0,
              0,
              canvasDrawRef.current.width,
              canvasDrawRef.current.height,
            );
            canvasCtx.restore();
            renderBlocks();
            canScroll.current = false;
            endRenderRows.cancel();
            console.count("endRenderRows");
            endRenderRows();
          }
        });

        const debouncedFn = debounce(
          () => {
            console.count("debouncedFn");
            if (scrollParent) {
              const {
                lastMouseMoveEvent,
                lastScrollHeight,
                lastScrollTop,
              } = scrollObj;
              const delta =
                scrollParent?.scrollHeight +
                scrollParent?.scrollTop -
                (lastScrollHeight + lastScrollTop);
              if (delta) {
                scrollParent.scrollBy({ top: delta, behavior: "smooth" });
              }
              onMouseMove({
                offsetX: lastMouseMoveEvent.offsetX,
                offsetY: lastMouseMoveEvent.offsetY + delta,
              });
              canScroll.current = true;
            }
          },
          50,
          {
            leading: false,
            trailing: true,
          },
        );

        const endRenderRows = throttle(
          () => {
            canScroll.current = false;
            debouncedFn.cancel();
            canScroll.current = true;
          },
          50,
          {
            leading: false,
            trailing: true,
          },
        );

        const renderBlocks = () => {
          if (
            canvasRef.current &&
            isCurrentDraggedCanvas &&
            canvasIsDragging &&
            canvasDrawRef.current
          ) {
            const canvasCtx: any = canvasDrawRef.current.getContext("2d");
            canvasCtx.save();
            canvasCtx.clearRect(
              0,
              0,
              canvasDrawRef.current.width,
              canvasDrawRef.current.height,
            );
            isUpdatingRows = false;
            if (canvasIsDragging) {
              currentRectanglesToDraw.forEach((each) => {
                drawBlockOnCanvas(each);
              });
            }
            canvasCtx.restore();
          }
        };

        const drawBlockOnCanvas = (blockDimensions: WidgetDraggingBlock) => {
          if (
            canvasDrawRef.current &&
            canvasRef.current &&
            scrollParent &&
            isCurrentDraggedCanvas &&
            canvasIsDragging
          ) {
            const canvasCtx: any = canvasDrawRef.current.getContext("2d");
            const topOffset = canExtend ? scrollParent.scrollTop : 0;
            const misplacedCozOfScroll = topOffset % snapRowSpace;
            const snappedXY = getSnappedXY(
              snapColumnSpace,
              snapRowSpace,
              {
                x: blockDimensions.left,
                y: blockDimensions.top - topOffset,
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
              blockDimensions.top -
                topOffset +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
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
              snappedXY.Y -
                misplacedCozOfScroll +
                strokeWidth +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
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
            if (delta) {
              console.count("onScroll");
            }
            onMouseMove({
              offsetX: lastMouseMoveEvent.offsetX,
              offsetY: lastMouseMoveEvent.offsetY + delta,
            });
          }
        };
        const initializeListeners = () => {
          canvasRef.current?.addEventListener("mousemove", onMouseMove, false);
          canvasRef.current?.addEventListener("mouseup", onMouseUp, false);
          scrollParent?.addEventListener("scroll", updateCanvasPosition, false);
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
          if (canvasRef.current && canvasDrawRef.current && scrollParent) {
            const { height } = scrollParent.getBoundingClientRect();
            const { width } = canvasRef.current.getBoundingClientRect();
            const canvasCtx: any = canvasDrawRef.current.getContext("2d");
            canvasDrawRef.current.width = width * scale;
            canvasDrawRef.current.height = height * scale;
            canvasCtx.scale(scale, scale);
            updateCanvasPosition();
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
