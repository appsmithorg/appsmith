import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce, throttle } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasDraggingArena";
import { useEffect, useRef } from "react";
import { AppState } from "reducers";
import { widgetReflowState } from "reducers/uiReducers/reflowReducer";
import { DimensionProps, ResizeDirection } from "resizable/resizenreflow";
import { useDragReflow } from "resizable/resizenreflow/useDragReflow";
import { getReflowWidgetSelector } from "selectors/widgetReflowSelectors";
import { useSelector } from "store";
import { getNearestParentCanvas } from "utils/generators";
import { getDropZoneOffsets, noCollision } from "utils/WidgetPropsUtils";
import { useWidgetDragResize } from "./dragResizeHooks";
import {
  useBlocksToBeDraggedOnCanvas,
  WidgetDraggingBlock,
} from "./useBlocksToBeDraggedOnCanvas";
import { useCanvasDragToScroll } from "./useCanvasDragToScroll";

export interface XYCord {
  x: number;
  y: number;
}
export const useCanvasDragging = (
  canvasRef: React.RefObject<HTMLDivElement>,
  canvasDrawRef: React.RefObject<HTMLCanvasElement>,
  {
    canExtend,
    dropDisabled,
    noPad,
    parentId,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  }: CanvasDraggingArenaProps,
) => {
  const { devicePixelRatio: scale = 1 } = window;
  const {
    blocksToDraw,
    defaultHandlePositions,
    getSnappedXY,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    updateRows,
    widgetOccupiedSpace,
  } = useBlocksToBeDraggedOnCanvas({
    canExtend,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  });
  const widgetParentSpaces = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: snapRowSpace,
    paddingOffset: 0,
  };
  const reflowStateRef = useRef<any>();
  // const reflowStateChange = useSelector(
  //   (state: AppState): widgetReflowState => state.ui.widgetReflow,
  // );
  // const widgetReflowSelector = getReflowWidgetSelector(widgetId);
  // const reflowState = useSelector(widgetReflowSelector);
  // useEffect(() => {
  //   reflowStateRef.current = reflowState;
  // }, [reflowStateChange]);
  const reflow = useRef<any>();
  reflow.current = useDragReflow(
    widgetOccupiedSpace ? widgetOccupiedSpace.id : "",
    widgetId || "",
    canvasRef,
    false,
    widgetParentSpaces,
  );
  const debouncedReflow = debounce(reflow.current);

  const {
    setDraggingCanvas,
    setDraggingNewWidget,
    setDraggingState,
  } = useWidgetDragResize();
  const getCanvasToDrawTopOffset = (
    scrollParentTop: number,
    scrollParentTopHeight: number,
    canvasTop: number,
    canvasHeight: number,
  ) => {
    return scrollParentTop > canvasTop
      ? Math.min(
          scrollParentTop - canvasTop,
          canvasHeight - scrollParentTopHeight,
        )
      : 0;
  };

  const updateCanvasStyles = () => {
    const parentCanvas: Element | null = getNearestParentCanvas(
      canvasRef.current,
    );

    if (parentCanvas && canvasDrawRef.current && canvasRef.current) {
      const {
        height: scrollParentTopHeight,
      } = parentCanvas.getBoundingClientRect();
      const { width } = canvasRef.current.getBoundingClientRect();
      canvasDrawRef.current.style.width = width + "px";
      canvasDrawRef.current.style.position = canExtend ? "absolute" : "sticky";
      canvasDrawRef.current.style.left = "0px";
      canvasDrawRef.current.style.top = getCanvasTopOffset() + "px";
      canvasDrawRef.current.style.height = scrollParentTopHeight + "px";
    }
  };

  const getCanvasTopOffset = () => {
    const parentCanvas: Element | null = getNearestParentCanvas(
      canvasRef.current,
    );

    if (parentCanvas && canvasDrawRef.current && canvasRef.current) {
      if (canExtend) {
        return parentCanvas.scrollTop;
      } else {
        const {
          height: scrollParentTopHeight,
          top: scrollParentTop,
        } = parentCanvas.getBoundingClientRect();
        const {
          height: canvasHeight,
          top: canvasTop,
        } = canvasRef.current.getBoundingClientRect();
        return getCanvasToDrawTopOffset(
          scrollParentTop,
          scrollParentTopHeight,
          canvasTop,
          canvasHeight,
        );
      }
    }
    return 0;
  };

  const canScroll = useCanvasDragToScroll(
    canvasRef,
    isCurrentDraggedCanvas,
    isDragging,
    snapRows,
    canExtend,
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
      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      const scrollObj: any = {};
      let last_position = {
        x: 0,
        y: 0,
      };
      let currentDirection = ResizeDirection.UNSET;

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
              setDraggingState({
                isDragging: false,
              });
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
              startPoints.left =
                relativeStartPoints.left || defaultHandlePositions.left;
              startPoints.top =
                relativeStartPoints.top || defaultHandlePositions.top;
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
        const getMouseMoveDirection = (event: any) => {
          if (last_position) {
            const deltaX = last_position.x - event.clientX,
              deltaY = last_position.y - event.clientY;
            const movements = [];
            last_position = {
              x: event.clientX,
              y: event.clientY,
            };
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
              movements.push("TOP");
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
              movements.push("BOTTOM");
            }
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
              movements.push("LEFT");
            } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
              movements.push("RIGHT");
            }
            return movements.length
              ? (movements.join("|") as ResizeDirection)
              : currentDirection;
          }
          return currentDirection;
        };
        const onMouseMove = (e: any) => {
          if (isDragging && canvasIsDragging && canvasRef.current) {
            currentDirection = getMouseMoveDirection(e);

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
              isNotColliding:
                !dropDisabled &&
                noCollision(
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
                  each.detachFromLayout,
                ),
            }));
            if (rowDelta && canvasRef.current) {
              isUpdatingRows = true;
              canScroll.current = false;
              renderNewRows(delta);
            } else if (!isUpdatingRows) {
              renderBlocks();
              // width: number;
              // height: number;
              // x: number;
              // y: number;
              // reset?: boolean;
              // direction: ResizeDirection;
              // X?: number;
              // Y?: number;
              const currentBlock = currentRectanglesToDraw[0];

              const snappedXY = getSnappedXY(
                snapColumnSpace,
                snapRowSpace,
                {
                  x: currentBlock.left,
                  y: currentBlock.top,
                },
                {
                  x: 0,
                  y: 0,
                },
              );
              const [leftColumn, topRow] = getDropZoneOffsets(
                snapColumnSpace,
                snapRowSpace,
                {
                  x: currentBlock.left,
                  y: currentBlock.top,
                },
                {
                  x: 0,
                  y: 0,
                },
              );

              const block: DimensionProps = {
                width: currentBlock.width / snapColumnSpace,
                height: currentBlock.height / snapRowSpace,
                x: 0,
                y: 0,
                X: (leftColumn - widgetOccupiedSpace.left) * snapColumnSpace,
                Y: (topRow - widgetOccupiedSpace.top) * snapRowSpace,
                // width: number;
                // height: number;
                // x: number;
                // y:
                direction: currentDirection,
              };
              debouncedReflow(
                block,
                widgetOccupiedSpace,
                {
                  ...currentBlock,
                  width: currentBlock.width / snapColumnSpace,
                  height: currentBlock.height / snapRowSpace,
                  left: leftColumn,
                  top: topRow,
                },
                reflowStateRef.current,
              );
            }
            scrollObj.lastMouseMoveEvent = {
              offsetX: e.offsetX,
              offsetY: e.offsetY,
            };
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
                isNotColliding:
                  !dropDisabled &&
                  noCollision(
                    { x: each.left + delta.left, y: each.top + delta.top },
                    snapColumnSpace,
                    snapRowSpace,
                    { x: 0, y: 0 },
                    each.columnWidth,
                    each.rowHeight,
                    each.widgetId,
                    occSpaces,
                    rowRef.current,
                    GridDefaults.DEFAULT_GRID_COLUMNS,
                    each.detachFromLayout,
                  ),
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
            endRenderRows();
          }
        });

        const endRenderRows = throttle(
          () => {
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
            const topOffset = getCanvasTopOffset();
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
                topOffset +
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
            onMouseMove({
              offsetX: lastMouseMoveEvent.offsetX,
              offsetY: lastMouseMoveEvent.offsetY + delta,
            });
          }
        };
        const initializeListeners = () => {
          canvasRef.current?.addEventListener("mousemove", onMouseMove, false);
          canvasRef.current?.addEventListener("mouseup", onMouseUp, false);
          scrollParent?.addEventListener("scroll", updateCanvasStyles, false);
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
            updateCanvasStyles();
            initializeListeners();
            if (
              (isChildOfCanvas || isNewWidgetInitialTargetCanvas) &&
              canvasRef.current
            ) {
              canvasRef.current.style.zIndex = "2";
            }
          }
        };
        startDragging();

        return () => {
          canvasRef.current?.removeEventListener("mousemove", onMouseMove);
          canvasRef.current?.removeEventListener("mouseup", onMouseUp);
          scrollParent?.removeEventListener("scroll", updateCanvasStyles);
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
  }, [isDragging, isResizing, blocksToDraw, snapRows, canExtend]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
