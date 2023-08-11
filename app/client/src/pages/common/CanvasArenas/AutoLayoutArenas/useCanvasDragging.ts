import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { CanvasDraggingArenaProps } from "pages/common/CanvasArenas/AutoLayoutArenas/AutoCanvasDraggingArena";
import type React from "react";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import { getTotalTopOffset } from "selectors/autoLayoutSelectors";
import type { HighlightInfo } from "utils/autoLayout/autoLayoutTypes";
import { getNearestParentCanvas } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { modifyBlockDimension } from "../hooks/canvasDraggingUtils";
import { useAutoLayoutHighlights } from "./useAutoLayoutHighlights";
import type { WidgetDraggingBlock } from "../hooks/useBlocksToBeDraggedOnCanvas";
import { useBlocksToBeDraggedOnCanvas } from "../hooks/useBlocksToBeDraggedOnCanvas";
import { useCanvasDragToScroll } from "../hooks/useCanvasDragToScroll";
import { useRenderBlocksOnCanvas } from "../hooks/useRenderBlocksOnCanvas";

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
    widgetId,
  }: CanvasDraggingArenaProps,
) => {
  const canvasPosition = useRef<{
    top: number;
    left: number;
    scrollOffset: number;
  }>({
    top: 0,
    left: 0,
    scrollOffset: 0,
  });

  const parentOffsetTop = useSelector(getTotalTopOffset(widgetId));
  const mainCanvas = document.querySelector("#canvas-viewport");
  const {
    blocksToDraw,
    defaultHandlePositions,
    getSnappedXY,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isCurrentDraggedLayout,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
    parentDiff,
    relativeStartPoints,
    rowRef,
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
    widgetId,
  });

  // eslint-disable-next-line prefer-const

  const { calculateHighlights, cleanUpTempStyles, getDropPosition } =
    useAutoLayoutHighlights({
      blocksToDraw,
      canvasId: widgetId,
      isCurrentDraggedCanvas,
      isCurrentDraggedLayout,
      isDragging,
      useAutoLayout: true,
    });
  let selectedHighlight: HighlightInfo | undefined;

  setTimeout(() => {
    calculateHighlights(snapColumnSpace);
  }, 0);

  if (!isDragging || !isCurrentDraggedCanvas) {
    cleanUpTempStyles();
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
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );

      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      const scrollObj: any = {};

      const resetCanvasState = () => {
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
        const onMouseUp = (e: any) => {
          if (isDragging && canvasIsDragging) {
            const delta = {
              left: e.clientX - canvasPosition.current.left,
              top:
                e.clientY -
                canvasPosition.current.top +
                canvasPosition.current.scrollOffset,
            };
            const dropInfo: HighlightInfo | undefined = getDropPosition(
              snapColumnSpace,
              delta,
              true,
            );
            if (dropInfo !== undefined)
              updateChildrenPositions(dropInfo, currentRectanglesToDraw);
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

        const onFirstMoveOnCanvas = (e: any) => {
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

            const canvasRect =
              slidingArenaRef.current?.getBoundingClientRect() || {
                left: 0,
                top: 0,
              };
            canvasPosition.current.left = canvasRect.left;
            canvasPosition.current.top = canvasRect.top;
            onMouseMove(e);
          }
        };

        const onMouseMove = (e: any) => {
          if (isDragging && canvasIsDragging && slidingArenaRef.current) {
            const delta = {
              left: e.clientX - canvasPosition.current.left,
              top:
                e.clientY -
                canvasPosition.current.top +
                canvasPosition.current.scrollOffset,
            };

            const drawingBlocks = blocksToDraw.map((each) =>
              modifyBlockDimension(
                {
                  ...each,
                  left:
                    each.left + e.offsetX - startPoints.left - parentDiff.left,
                  top: each.top + e.offsetY - startPoints.top - parentDiff.top,
                },
                snapColumnSpace,
                snapRowSpace,
                rowRef.current - 1,
                canExtend,
                true,
              ),
            );
            const newRows = updateRelativeRows(drawingBlocks, rowRef.current);
            rowRef.current = newRows ? newRows : rowRef.current;
            currentRectanglesToDraw = drawingBlocks.map((each) => ({
              ...each,
              isNotColliding: !dropDisabled,
            }));
            if (!isUpdatingRows) {
              if (isCurrentDraggedCanvas) {
                setTimeout(() => {
                  selectedHighlight = getDropPosition(snapColumnSpace, delta);
                }, 50);
              }
            }
            isUpdatingRows = renderBlocks(
              currentRectanglesToDraw,
              {},
              isUpdatingRows,
              canvasIsDragging,
              scrollParent,
              selectedHighlight,
              widgetId === MAIN_CONTAINER_WIDGET_ID,
              parentOffsetTop,
              true,
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
              canvasPosition.current.scrollOffset =
                scrollParent?.scrollTop || 0;
            }
          }, 0);
        const onMouseOver = (e: any) => {
          onFirstMoveOnCanvas(e);
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
  }, [isDragging, isResizing, blocksToDraw, snapRows, canExtend]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
