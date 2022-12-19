import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { debounce, isEmpty, throttle } from "lodash";
import { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  HORIZONTAL_RESIZE_LIMIT,
  MovementLimitMap,
  ReflowDirection,
  ReflowedSpaceMap,
  SpaceMap,
  VERTICAL_RESIZE_LIMIT,
} from "reflow/reflowTypes";
import { getZoomLevel } from "selectors/editorSelectors";
import { getNearestParentCanvas } from "utils/generators";
import { getAbsolutePixels } from "utils/helpers";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { ReflowInterface, useReflow } from "utils/hooks/useReflow";
import {
  getDraggingSpacesFromBlocks,
  getMousePositionsOnCanvas,
  modifyBlockDimension,
  noCollision,
} from "utils/WidgetPropsUtils";
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
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  {
    canExtend,
    dropDisabled,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  }: CanvasDraggingArenaProps,
) => {
  const canvasZoomLevel = useSelector(getZoomLevel);
  const currentDirection = useRef<ReflowDirection>(ReflowDirection.UNSET);
  const { devicePixelRatio: scale = 1 } = window;
  const {
    blocksToDraw,
    defaultHandlePositions,
    draggingSpaces,
    getSnappedXY,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    lastDraggedCanvas,
    occSpaces,
    onDrop,
    parentDiff,
    relativeStartPoints,
    rowRef,
    stopReflowing,
    updateBottomRow,
    updateRelativeRows,
  } = useBlocksToBeDraggedOnCanvas({
    canExtend,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  });
  const gridProps = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: snapRowSpace,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
    paddingOffset: 0,
  };

  const reflow = useRef<{
    reflowSpaces: ReflowInterface;
    resetReflow: () => void;
  }>();
  reflow.current = useReflow(draggingSpaces, widgetId || "", gridProps);

  const {
    setDraggingCanvas,
    setDraggingNewWidget,
    setDraggingState,
  } = useWidgetDragResize();

  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas,
    isDragging,
    snapRows,
    canExtend,
  );

  useEffect(() => {
    if (
      slidingArenaRef.current &&
      !isResizing &&
      isDragging &&
      blocksToDraw.length > 0
    ) {
      // doing throttling coz reflow moves are also throttled and resetCanvas can be called multiple times
      const throttledStopReflowing = throttle(stopReflowing, 50);
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );
      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      const scrollObj: any = {};

      let currentReflowParams: {
        movementLimitMap?: MovementLimitMap;
        bottomMostRow: number;
        movementMap: ReflowedSpaceMap;
        spacePositionMap: SpaceMap | undefined;
      } = {
        movementLimitMap: {},
        bottomMostRow: 0,
        movementMap: {},
        spacePositionMap: {},
      };
      let lastSnappedPosition: OccupiedSpace = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        id: "",
      };

      const resetCanvasState = () => {
        throttledStopReflowing();
        reflow.current?.resetReflow();
        if (stickyCanvasRef.current && slidingArenaRef.current) {
          const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          slidingArenaRef.current.style.zIndex = "";
          canvasIsDragging = false;
        }
      };

      if (isDragging) {
        const startPoints = defaultHandlePositions;
        const onMouseUp = () => {
          if (isDragging && canvasIsDragging) {
            const { movementMap: reflowingWidgets } = currentReflowParams;
            const reflowedPositionsUpdatesWidgets: OccupiedSpace[] = occSpaces
              .filter((each) => !!reflowingWidgets[each.id])
              .map((each) => {
                const reflowedWidget = reflowingWidgets[each.id];
                if (
                  reflowedWidget.X !== undefined &&
                  (Math.abs(reflowedWidget.X) || reflowedWidget.width)
                ) {
                  const movement = reflowedWidget.X / snapColumnSpace;
                  const newWidth = reflowedWidget.width
                    ? reflowedWidget.width / snapColumnSpace
                    : each.right - each.left;
                  each = {
                    ...each,
                    left: each.left + movement,
                    right: each.left + movement + newWidth,
                  };
                }
                if (
                  reflowedWidget.Y !== undefined &&
                  (Math.abs(reflowedWidget.Y) || reflowedWidget.height)
                ) {
                  const movement = reflowedWidget.Y / snapRowSpace;
                  const newHeight = reflowedWidget.height
                    ? reflowedWidget.height / snapRowSpace
                    : each.bottom - each.top;
                  each = {
                    ...each,
                    top: each.top + movement,
                    bottom: each.top + movement + newHeight,
                  };
                }
                return each;
              });

            onDrop(
              modifyDrawingRectangles(
                currentRectanglesToDraw,
                currentReflowParams.spacePositionMap,
                snapColumnSpace,
                snapRowSpace,
              ),
              reflowedPositionsUpdatesWidgets,
            );
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

        const onFirstMoveOnCanvas = (e: any, over = false) => {
          if (
            !isResizing &&
            isDragging &&
            !canvasIsDragging &&
            slidingArenaRef.current
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
            slidingArenaRef.current.style.zIndex = "2";
            onMouseMove(e, over);
          }
        };

        const getMoveDirection = (
          prevPosition: OccupiedSpace,
          currentPosition: OccupiedSpace,
        ) => {
          if (!prevPosition || !currentPosition)
            return currentDirection.current;

          if (
            currentPosition.right - prevPosition.right > 0 ||
            currentPosition.left - prevPosition.left < 0
          )
            return ReflowDirection.RIGHT;

          if (
            currentPosition.right - prevPosition.right < 0 ||
            currentPosition.left - prevPosition.left > 0
          )
            return ReflowDirection.LEFT;

          if (
            currentPosition.bottom - prevPosition.bottom > 0 ||
            currentPosition.top - prevPosition.top < 0
          )
            return ReflowDirection.BOTTOM;

          if (
            currentPosition.bottom - prevPosition.bottom < 0 ||
            currentPosition.top - prevPosition.top > 0
          )
            return ReflowDirection.TOP;

          return currentDirection.current;
        };

        const getClosestEdge = (
          x: number,
          y: number,
          width: number | undefined,
        ) => {
          if (width === undefined) return currentDirection.current;
          const topEdgeDist = Math.abs(y);
          const leftEdgeDist = Math.abs(x);
          const rightEdgeDist = Math.abs(width - x);
          const min = Math.min(topEdgeDist, leftEdgeDist, rightEdgeDist);
          switch (min) {
            case leftEdgeDist:
              return ReflowDirection.RIGHT;
            case rightEdgeDist:
              return ReflowDirection.LEFT;
            case topEdgeDist:
              return ReflowDirection.BOTTOM;
            default:
              return currentDirection.current;
          }
        };

        const triggerReflow = (e: any, firstMove: boolean) => {
          const canReflow =
            !currentRectanglesToDraw[0].detachFromLayout && !dropDisabled;

          //The position array of dragging Widgets.
          const resizedPositions = getDraggingSpacesFromBlocks(
            currentRectanglesToDraw,
            snapColumnSpace,
            snapRowSpace,
          );
          const currentBlock = resizedPositions[0];
          const mousePosition = getMousePositionsOnCanvas(e, gridProps);
          const needsReflow = !(
            lastSnappedPosition.left === currentBlock.left &&
            lastSnappedPosition.top === currentBlock.top &&
            lastSnappedPosition.bottom === currentBlock.bottom &&
            lastSnappedPosition.right === currentBlock.right
          );
          if (canReflow && reflow.current) {
            if (needsReflow) {
              currentDirection.current = getMoveDirection(
                lastSnappedPosition,
                currentBlock,
              );
              if (firstMove) {
                currentDirection.current = getClosestEdge(
                  e.offsetX,
                  e.offsetY,
                  slidingArenaRef.current?.clientWidth,
                );
              }
              lastSnappedPosition = { ...currentBlock };
              let immediateExitContainer;
              if (lastDraggedCanvas.current) {
                immediateExitContainer = lastDraggedCanvas.current;
                lastDraggedCanvas.current = undefined;
              }
              currentReflowParams = reflow.current?.reflowSpaces(
                resizedPositions,
                currentDirection.current,
                false,
                true,
                firstMove,
                immediateExitContainer,
                mousePosition,
                reflowAfterTimeoutCallback,
              );
            }

            const isReflowing =
              !isEmpty(currentReflowParams.movementMap) ||
              (!isEmpty(currentReflowParams.movementLimitMap) &&
                currentRectanglesToDraw.length === 1);

            if (isReflowing) {
              const { movementLimitMap } = currentReflowParams;

              for (const block of currentRectanglesToDraw) {
                const isWithinParentBoundaries = noCollision(
                  { x: block.left, y: block.top },
                  snapColumnSpace,
                  snapRowSpace,
                  { x: 0, y: 0 },
                  block.columnWidth,
                  block.rowHeight,
                  block.widgetId,
                  [],
                  rowRef.current,
                  GridDefaults.DEFAULT_GRID_COLUMNS,
                  block.detachFromLayout,
                );

                let isNotReachedLimit = true;
                const currentBlockLimit =
                  movementLimitMap && movementLimitMap[block.widgetId];
                if (currentBlockLimit) {
                  isNotReachedLimit =
                    currentBlockLimit.canHorizontalMove &&
                    currentBlockLimit.canVerticalMove;
                }
                block.isNotColliding =
                  isWithinParentBoundaries && isNotReachedLimit;
              }
              const widgetIdsToExclude = currentRectanglesToDraw.map(
                (a) => a.widgetId,
              );
              const newRows = updateBottomRow(
                currentReflowParams.bottomMostRow,
                rowRef.current,
                widgetIdsToExclude,
              );
              rowRef.current = newRows ? newRows : rowRef.current;
            }
          }
        };
        const onMouseMove = (e: any, firstMove = false) => {
          if (isDragging && canvasIsDragging && slidingArenaRef.current) {
            const delta = {
              left: e.offsetX - startPoints.left - parentDiff.left,
              top: e.offsetY - startPoints.top - parentDiff.top,
            };

            const drawingBlocks = blocksToDraw.map((each) =>
              modifyBlockDimension(
                {
                  ...each,
                  left: each.left + delta.left,
                  top: each.top + delta.top,
                },
                snapColumnSpace,
                snapRowSpace,
                rowRef.current - 1,
                canExtend,
              ),
            );
            const newRows = updateRelativeRows(drawingBlocks, rowRef.current);
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
            if (rowDelta && slidingArenaRef.current) {
              isUpdatingRows = true;
              canScroll.current = false;
              renderNewRows(delta);
            } else if (!isUpdatingRows) {
              triggerReflow(e, firstMove);
              renderBlocks(
                modifyDrawingRectangles(
                  currentRectanglesToDraw,
                  currentReflowParams.spacePositionMap,
                  snapColumnSpace,
                  snapRowSpace,
                ),
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
          if (slidingArenaRef.current && stickyCanvasRef.current) {
            const canvasCtx: any = stickyCanvasRef.current.getContext("2d");

            currentRectanglesToDraw = blocksToDraw.map((each) => {
              const block = modifyBlockDimension(
                {
                  ...each,
                  left: each.left + delta.left,
                  top: each.top + delta.top,
                },
                snapColumnSpace,
                snapRowSpace,
                rowRef.current - 1,
                canExtend,
              );
              return {
                ...block,
                left: block.left,
                top: block.top,
                isNotColliding:
                  !dropDisabled &&
                  noCollision(
                    { x: block.left, y: block.top },
                    snapColumnSpace,
                    snapRowSpace,
                    { x: 0, y: 0 },
                    block.columnWidth,
                    block.rowHeight,
                    block.widgetId,
                    occSpaces,
                    rowRef.current,
                    GridDefaults.DEFAULT_GRID_COLUMNS,
                    block.detachFromLayout,
                  ),
              };
            });
            canvasCtx.save();
            canvasCtx.scale(scale, scale);
            canvasCtx.clearRect(
              0,
              0,
              stickyCanvasRef.current.width,
              stickyCanvasRef.current.height,
            );
            canvasCtx.restore();
            renderBlocks(currentRectanglesToDraw);
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

        const reflowAfterTimeoutCallback = (reflowParams: {
          movementMap: ReflowedSpaceMap;
          spacePositionMap: SpaceMap | undefined;
        }) => {
          currentReflowParams = { ...currentReflowParams, ...reflowParams };
          renderBlocks(
            modifyDrawingRectangles(
              currentRectanglesToDraw,
              currentReflowParams.spacePositionMap,
              snapColumnSpace,
              snapRowSpace,
            ),
          );
        };

        const renderBlocks = (rectanglesToDraw: WidgetDraggingBlock[]) => {
          if (
            slidingArenaRef.current &&
            isCurrentDraggedCanvas &&
            canvasIsDragging &&
            stickyCanvasRef.current
          ) {
            const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
            canvasCtx.save();
            canvasCtx.clearRect(
              0,
              0,
              stickyCanvasRef.current.width,
              stickyCanvasRef.current.height,
            );
            isUpdatingRows = false;
            canvasCtx.transform(canvasZoomLevel, 0, 0, canvasZoomLevel, 0, 0);
            if (canvasIsDragging) {
              rectanglesToDraw.forEach((each) => {
                drawBlockOnCanvas(each);
              });
            }
            canvasCtx.restore();
          }
        };

        const drawBlockOnCanvas = (blockDimensions: WidgetDraggingBlock) => {
          if (
            stickyCanvasRef.current &&
            slidingArenaRef.current &&
            scrollParent &&
            isCurrentDraggedCanvas &&
            canvasIsDragging
          ) {
            const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
            const topOffset = getAbsolutePixels(
              stickyCanvasRef.current.style.top,
            );
            const leftOffset = getAbsolutePixels(
              stickyCanvasRef.current.style.left,
            );
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
              blockDimensions.isNotColliding
                ? "rgb(104,	113,	239, 0.6)"
                : "rgb(255,	55,	35, 0.6)"
            }`;
            canvasCtx.fillRect(
              blockDimensions.left -
                leftOffset +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
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
              snappedXY.X -
                leftOffset +
                strokeWidth +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
              snappedXY.Y -
                topOffset +
                strokeWidth +
                (noPad ? 0 : CONTAINER_GRID_PADDING),
              blockDimensions.width - strokeWidth,
              blockDimensions.height - strokeWidth,
            );
          }
        };
        // Adding setTimeout to make sure this gets called after
        // the onscroll that resets intersectionObserver in StickyCanvasArena.tsx
        const onScroll = () =>
          setTimeout(() => {
            const {
              lastMouseMoveEvent,
              lastScrollHeight,
              lastScrollTop,
            } = scrollObj;
            if (
              lastMouseMoveEvent &&
              typeof lastScrollHeight === "number" &&
              typeof lastScrollTop === "number" &&
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
          }, 0);
        const onMouseOver = (e: any) => {
          onFirstMoveOnCanvas(e, true);
        };
        const initializeListeners = () => {
          slidingArenaRef.current?.addEventListener(
            "mousemove",
            onMouseMove,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseup",
            onMouseUp,
            false,
          );
          scrollParent?.addEventListener("scroll", onScroll, false);

          slidingArenaRef.current?.addEventListener(
            "mouseover",
            onMouseOver,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseout",
            resetCanvasState,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseleave",
            resetCanvasState,
            false,
          );
          document.body.addEventListener("mouseup", onMouseUp, false);
          window.addEventListener("mouseup", onMouseUp, false);
        };
        const startDragging = () => {
          if (
            slidingArenaRef.current &&
            stickyCanvasRef.current &&
            scrollParent
          ) {
            initializeListeners();
            if (
              (isChildOfCanvas || isNewWidgetInitialTargetCanvas) &&
              slidingArenaRef.current
            ) {
              slidingArenaRef.current.style.zIndex = "2";
            }
          }
        };
        startDragging();

        return () => {
          slidingArenaRef.current?.removeEventListener(
            "mousemove",
            onMouseMove,
          );
          slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
          scrollParent?.removeEventListener("scroll", onScroll);
          slidingArenaRef.current?.removeEventListener(
            "mouseover",
            onMouseOver,
          );
          slidingArenaRef.current?.removeEventListener(
            "mouseout",
            resetCanvasState,
          );
          slidingArenaRef.current?.removeEventListener(
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

function modifyDrawingRectangles(
  rectanglesToDraw: WidgetDraggingBlock[],
  spaceMap: SpaceMap | undefined,
  snapColumnSpace: number,
  snapRowSpace: number,
): WidgetDraggingBlock[] {
  if (
    rectanglesToDraw.length !== 1 ||
    !spaceMap?.[rectanglesToDraw[0]?.widgetId]
  )
    return rectanglesToDraw;

  const { bottom, left, right, top } = spaceMap[rectanglesToDraw[0].widgetId];

  const resizedPosition = getDraggingSpacesFromBlocks(
    rectanglesToDraw,
    snapColumnSpace,
    snapRowSpace,
  )[0];

  return [
    {
      ...rectanglesToDraw[0],
      left:
        (left - resizedPosition.left) * snapColumnSpace +
        rectanglesToDraw[0].left,
      top: (top - resizedPosition.top) * snapRowSpace + rectanglesToDraw[0].top,
      width: (right - left) * snapColumnSpace,
      height: (bottom - top) * snapRowSpace,
      rowHeight: bottom - top,
      columnWidth: right - left,
      isNotColliding:
        rectanglesToDraw[0].isNotColliding &&
        bottom - top >= VERTICAL_RESIZE_LIMIT &&
        right - left >= HORIZONTAL_RESIZE_LIMIT,
    },
  ];
}
