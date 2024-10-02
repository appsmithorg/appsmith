import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type React from "react";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

import { getTotalTopOffset } from "selectors/autoLayoutSelectors";
import { getNearestParentCanvas } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useAutoLayoutHighlights } from "./useAutoLayoutHighlights";
import type { WidgetDraggingBlock } from "../../../../common/canvasArenas/ArenaTypes";
import { useBlocksToBeDraggedOnCanvas } from "./useBlocksToBeDraggedOnCanvas";
import { useRenderBlocksOnCanvas } from "./useRenderBlocksOnCanvas";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
import type { AutoCanvasDraggingArenaProps } from "../AutoCanvasDraggingArena";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import { modifyBlockDimension } from "layoutSystems/common/utils/canvasDraggingUtils";
import { CANVAS_VIEWPORT } from "constants/componentClassNameConstants";

/**
 * useCanvasDragging hook is utilized to handle all drag and drop related functions that are required to give user the sense of dragging and dropping while moving a widget on canvas
 * @param slidingArenaRef
 * @param stickyCanvasRef
 * @param object that contains,
 * @prop alignItems, defines the alignment of elements on widget canvas
 * @prop canExtend, indicates if the canvas can extend
 * @prop direction, defines direction of alignment of widgets on canvas
 * @props dropDisabled indicates if dropping wi is enabled on the canvas
 * @prop noPad, indicates if the widget canvas has padding
 * @prop snapColumnSpace, width between two columns grid
 * @prop snapRows, number of rows in the canvas
 * @prop snapRowSpace, height between two row grid
 * @prop widgetId, id of the current widget canvas associated with current AutoCanvasDraggingArena
 * @returns showCanvas to indicate if the html canvas side should be rendered
 */
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
  }: AutoCanvasDraggingArenaProps,
) => {
  const parentOffsetTop = useSelector(getTotalTopOffset(widgetId));
  const mainCanvas = document.getElementById(CANVAS_VIEWPORT);
  const {
    blocksToDraw,
    defaultHandlePositions,
    isChildOfCanvas,
    isCurrentDraggedCanvas,
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

  const { calculateHighlights, cleanUpTempStyles, getDropPosition } =
    useAutoLayoutHighlights({
      blocksToDraw,
      canvasId: widgetId,
      isCurrentDraggedCanvas,
      isDragging,
    });
  let selectedHighlight: HighlightInfo | undefined;

  calculateHighlights(snapColumnSpace);

  if (!isDragging || !isCurrentDraggedCanvas) {
    cleanUpTempStyles();
  }

  const { setDraggingCanvas, setDraggingNewWidget, setDraggingState } =
    useWidgetDragResize();

  const canvasRenderingDependencies = useMemo(
    () => ({
      snapRows,
      canExtend,
    }),
    [snapRows, canExtend],
  );
  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas,
    isDragging,
    canvasRenderingDependencies,
  );

  const renderBlocks = useRenderBlocksOnCanvas(
    slidingArenaRef,
    stickyCanvasRef,
    !!noPad,
    snapColumnSpace,
    snapRowSpace,
    isCurrentDraggedCanvas,
  );

  useEffect(() => {
    if (
      slidingArenaRef.current &&
      !isResizing &&
      isDragging &&
      blocksToDraw.length > 0
    ) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );

      let canvasIsDragging = false;
      let isUpdatingRows = false;
      let currentRectanglesToDraw: WidgetDraggingBlock[] = [];
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scrollObj: any = {};

      const resetCanvasState = () => {
        if (stickyCanvasRef.current && slidingArenaRef.current) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        const onMouseUp = () => {
          if (isDragging && canvasIsDragging) {
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

        const onFirstMoveOnCanvas = (e: MouseEvent) => {
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
            onMouseMove(e);
          }
        };

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onMouseMove = (e: any) => {
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
                  selectedHighlight = getDropPosition(snapColumnSpace, e);
                }, 50);
              }
            }

            isUpdatingRows = renderBlocks(
              currentRectanglesToDraw,
              isUpdatingRows,
              canvasIsDragging,
              scrollParent,
              selectedHighlight,
              widgetId === MAIN_CONTAINER_WIDGET_ID,
              parentOffsetTop,
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
              lastScrollHeight &&
              lastScrollTop &&
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
