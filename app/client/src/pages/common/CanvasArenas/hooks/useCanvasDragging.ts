import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { debounce, isEmpty, throttle } from "lodash";
import type { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/CanvasDraggingArena";
import type React from "react";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type {
  MovementLimitMap,
  ReflowedSpaceMap,
  SpaceMap,
} from "reflow/reflowTypes";
import { ReflowDirection } from "reflow/reflowTypes";
import { getTotalTopOffset } from "selectors/autoLayoutSelectors";
import { getCanvasScale } from "selectors/editorSelectors";
import type { HighlightInfo } from "utils/autoLayout/autoLayoutTypes";
import { getNearestParentCanvas } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import type { ReflowInterface } from "utils/hooks/useReflow";
import { useReflow } from "utils/hooks/useReflow";
import {
  getDraggingSpacesFromBlocks,
  getMousePositionsOnCanvas,
  noCollision,
} from "utils/WidgetPropsUtils";
import {
  getEdgeDirection,
  getMoveDirection,
  getReflowedSpaces,
  modifyBlockDimension,
  modifyDrawingRectangles,
  updateRectanglesPostReflow,
} from "./canvasDraggingUtils";
import { useAutoLayoutHighlights } from "./useAutoLayoutHighlights";
import type { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";
import { useBlocksToBeDraggedOnCanvas } from "./useBlocksToBeDraggedOnCanvas";
import { useCanvasDragToScroll } from "./useCanvasDragToScroll";
import { useRenderBlocksOnCanvas } from "./useRenderBlocksOnCanvas";

export const useCanvasDragging = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  {
    alignItems,
    canExtend,
    direction,
    dropDisabled,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    useAutoLayout,
    widgetId,
  }: CanvasDraggingArenaProps,
) => {
  const canvasScale = useSelector(getCanvasScale);
  const currentDirection = useRef<ReflowDirection>(ReflowDirection.UNSET);
  let { devicePixelRatio: scale = 1 } = window;
  scale *= canvasScale;
  const parentOffsetTop = useSelector(getTotalTopOffset(widgetId));
  const mainCanvas = document.querySelector("#canvas-viewport");
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
    updateChildrenPositions,
    updateRelativeRows,
  } = useBlocksToBeDraggedOnCanvas({
    alignItems,
    canExtend,
    direction,
    noPad,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    useAutoLayout,
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

  // eslint-disable-next-line prefer-const

  const { calculateHighlights, cleanUpTempStyles, getDropPosition } =
    useAutoLayoutHighlights({
      blocksToDraw,
      canvasId: widgetId,
      isCurrentDraggedCanvas,
      isDragging,
      useAutoLayout,
    });
  let selectedHighlight: HighlightInfo | undefined;

  if (useAutoLayout) {
    setTimeout(() => {
      calculateHighlights(snapColumnSpace);
    }, 0);

    if (!isDragging || !isCurrentDraggedCanvas) {
      cleanUpTempStyles();
    }
  }

  const { setDraggingCanvas, setDraggingNewWidget, setDraggingState } =
    useWidgetDragResize();

  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas,
    isDragging,
    snapRows,
    canExtend,
  );

  const renderBlocks = useRenderBlocksOnCanvas(
    slidingArenaRef,
    stickyCanvasRef,
    !!noPad,
    snapColumnSpace,
    snapRowSpace,
    getSnappedXY,
    isCurrentDraggedCanvas,
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
        if (isDragging) {
          setDraggingCanvas(MAIN_CONTAINER_WIDGET_ID);
        }
      };

      if (isDragging) {
        const startPoints = defaultHandlePositions;
        /**
         * On mouse up, calculate the top, left, bottom and right positions for each of the reflowed widgets
         */
        const onMouseUp = () => {
          if (isDragging && canvasIsDragging) {
            if (useAutoLayout) {
              const dropInfo: HighlightInfo | undefined = getDropPosition(
                snapColumnSpace,
                null,
                {
                  x: currentRectanglesToDraw[0].top,
                  y: currentRectanglesToDraw[0].left,
                },
                true,
              );
              if (dropInfo !== undefined)
                updateChildrenPositions(dropInfo, currentRectanglesToDraw);
            } else {
              const { movementMap: reflowingWidgets } = currentReflowParams;
              const reflowedPositionsUpdatesWidgets: OccupiedSpace[] = occSpaces
                .filter((each) => !!reflowingWidgets[each.id])
                .map((each) =>
                  getReflowedSpaces(
                    each,
                    reflowingWidgets,
                    snapColumnSpace,
                    snapRowSpace,
                  ),
                );

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
          }
          startPoints.top = defaultHandlePositions.top;
          startPoints.left = defaultHandlePositions.left;
          resetCanvasState();

          resetDragging();
        };

        const resetDragging = () => {
          setTimeout(() => {
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
          }, 0);
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

        const triggerReflow = (e: any, firstMove: boolean) => {
          const canReflow =
            !currentRectanglesToDraw[0].detachFromLayout &&
            !dropDisabled &&
            !useAutoLayout;
          const isReflowing =
            !isEmpty(currentReflowParams.movementMap) ||
            (!isEmpty(currentReflowParams.movementLimitMap) &&
              currentRectanglesToDraw.length === 1);
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
                currentDirection.current,
              );
              if (firstMove) {
                currentDirection.current = getEdgeDirection(
                  e.offsetX,
                  e.offsetY,
                  slidingArenaRef.current?.clientWidth,
                  currentDirection.current,
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

            if (isReflowing) {
              updateParamsPostReflow();
            }
          }
        };

        //update blocks after reflow
        const updateParamsPostReflow = () => {
          const { movementLimitMap } = currentReflowParams;

          // update isColliding of each block based on movementLimitMap
          currentRectanglesToDraw = updateRectanglesPostReflow(
            movementLimitMap,
            currentRectanglesToDraw,
            snapColumnSpace,
            snapRowSpace,
            rowRef.current,
          );

          const widgetIdsToExclude = currentRectanglesToDraw.map(
            (a) => a.widgetId,
          );
          const newRows = updateBottomRow(
            currentReflowParams.bottomMostRow,
            rowRef.current,
            widgetIdsToExclude,
          );
          rowRef.current = newRows ? newRows : rowRef.current;
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
                useAutoLayout || false,
              ),
            );
            const newRows = updateRelativeRows(drawingBlocks, rowRef.current);
            const rowDelta = newRows ? newRows - rowRef.current : 0;
            rowRef.current = newRows ? newRows : rowRef.current;
            currentRectanglesToDraw = drawingBlocks.map((each) => ({
              ...each,
              isNotColliding:
                useAutoLayout ||
                (!dropDisabled &&
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
                  )),
            }));
            if (rowDelta && slidingArenaRef.current && !useAutoLayout) {
              isUpdatingRows = true;
              canScroll.current = false;
              renderNewRows(delta);
            } else if (!isUpdatingRows) {
              triggerReflow(e, firstMove);

              if (useAutoLayout && isCurrentDraggedCanvas) {
                setTimeout(() => {
                  selectedHighlight = getDropPosition(snapColumnSpace, e);
                }, 50);
              }
            }
            isUpdatingRows = renderBlocks(
              currentRectanglesToDraw,
              currentReflowParams.spacePositionMap,
              isUpdatingRows,
              canvasIsDragging,
              scrollParent,
              selectedHighlight,
              widgetId === MAIN_CONTAINER_WIDGET_ID,
              parentOffsetTop,
              useAutoLayout,
              mainCanvas?.scrollTop,
            );
            scrollObj.lastMouseMoveEvent = {
              offsetX: e.offsetX,
              offsetY: e.offsetY,
            };
            scrollObj.lastScrollTop = scrollParent?.scrollTop;
            scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
            scrollObj.lastDeltaLeft = delta.left;
            scrollObj.lastDeltaTop = delta.top;
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
                useAutoLayout || false,
              );
              return {
                ...block,
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
            isUpdatingRows = renderBlocks(
              currentRectanglesToDraw,
              currentReflowParams.spacePositionMap,
              isUpdatingRows,
              canvasIsDragging,
              scrollParent,
            );
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
          movementLimitMap: MovementLimitMap | undefined;
        }) => {
          currentReflowParams = { ...currentReflowParams, ...reflowParams };
          updateParamsPostReflow();
          isUpdatingRows = renderBlocks(
            currentRectanglesToDraw,
            currentReflowParams.spacePositionMap,
            isUpdatingRows,
            canvasIsDragging,
            scrollParent,
          );
        };

        // Adding setTimeout to make sure this gets called after
        // the onscroll that resets intersectionObserver in StickyCanvasArena.tsx
        const onScroll = () =>
          setTimeout(() => {
            const { lastMouseMoveEvent, lastScrollHeight, lastScrollTop } =
              scrollObj;
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

        //Initialize Listeners
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
  }, [
    isDragging,
    isResizing,
    blocksToDraw,
    snapRows,
    canExtend,
    useAutoLayout,
  ]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
