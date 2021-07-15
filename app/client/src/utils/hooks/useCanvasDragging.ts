import { getSnappedXY } from "components/editorComponents/Dropzone";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasDraggingArena";
import { useEffect } from "react";
import { getNearestParentCanvas } from "utils/generators";
import { getScrollByPixels } from "utils/helpers";
import { noCollision } from "utils/WidgetPropsUtils";
import { useWidgetDragResize } from "./dragResizeHooks";
import {
  useBlocksToBeDraggedOnCanvas,
  WidgetDraggingBlock,
} from "./useBlocksToBeDraggedOnCanvas";

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
  useEffect(() => {
    if (
      canvasRef.current &&
      !isResizing &&
      isDragging &&
      blocksToDraw.length > 0
    ) {
      const { devicePixelRatio: scale = 1 } = window;

      let canvasIsDragging = false;
      let notDoneYet = false;
      let animationFrameId: number;
      let scrollTimeOut: number[] = [];
      let scrollDirection = 0;
      let scrollByPixels = 0;
      let speed = 0;
      const scrollFn = (scrollParent: Element | null) => {
        if (isDragging && isCurrentDraggedCanvas && scrollParent) {
          if (
            (scrollByPixels < 0 && scrollParent.scrollTop > 0) ||
            scrollByPixels > 0
          ) {
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
          scrollTimeOut.push(
            setTimeout(
              () => scrollFn(scrollParent),
              100 * Math.max(0.4, speed),
            ),
          );
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
        if (isDragging && canvasIsDragging && isCurrentDraggedCanvas) {
          const scrollParent: Element | null = getNearestParentCanvas(
            canvasRef.current,
          );
          if (canvasRef.current && scrollParent) {
            const scrollObj = getScrollByPixels(
              {
                top: e.offsetY,
                height: 0,
              },
              scrollParent,
              canvasRef.current,
            );
            scrollByPixels = scrollObj.scrollAmount;
            speed = scrollObj.speed;
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
            if (isNewWidget) {
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
            if (!isNewWidget) {
              startPoints.left = relativeStartPoints.left;
              startPoints.top = relativeStartPoints.top;
            }
            if (!isCurrentDraggedCanvas) {
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

            const drawingBlocks = blocksToDraw.map((each) => ({
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
            newRectanglesToDraw = blocksToDraw.map((each) => {
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
          if (canvasRef.current && isCurrentDraggedCanvas) {
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

        const drawRectangle = (selectionDimensions: WidgetDraggingBlock) => {
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
            blocksToDraw.forEach((each) => {
              drawRectangle(each);
            });
          }
        };
        startDragging();
        if (isChildOfCanvas) {
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
  }, [isDragging, isResizing, blocksToDraw, snapRows]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
