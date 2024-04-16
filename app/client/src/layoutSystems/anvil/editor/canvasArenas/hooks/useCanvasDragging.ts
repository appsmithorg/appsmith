import type React from "react";
import { useEffect, useRef } from "react";
import type { AnvilHighlightingCanvasProps } from "layoutSystems/anvil/editor/canvasArenas/AnvilHighlightingCanvas";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { getNearestParentCanvas } from "utils/generators";
import {
  computeCanvasToLayoutGap,
  getClosestHighlight,
  getEdgeHighlightOffset,
} from "../utils/utils";
import { AnvilCanvasZIndex } from "layoutSystems/anvil/editor/canvas/hooks/useCanvasActivation";
import { useDispatch } from "react-redux";
import { throttle } from "lodash";
import { setHighlightsDrawnAction } from "layoutSystems/anvil/integrations/actions/draggingActions";
import { renderDisallowOnCanvas } from "../utils/canvasRenderUtils";
import { getAbsolutePixels } from "utils/helpers";

/**
 *
 *  This hook is written to accumulate all logic that is needed to
 *  - initialize event listeners for canvas
 *  - adjust z-index of canvas
 *  - track mouse position on canvas
 *  - render highlights on the canvas
 *  - render warning to denote that a particular widget type is not allowed to drop on canvas
 *  - auto scroll canvas when needed.
 *  - invoke onDrop callback as per the anvilDragStates
 */
export const useCanvasDragging = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  props: AnvilHighlightingCanvasProps,
  setHighlightShown: (highlight: AnvilHighlightInfo | null) => void,
) => {
  const { anvilDragStates, deriveAllHighlightsFn, layoutId, onDrop } = props;
  const {
    activateOverlayWidgetDrop,
    allowToDrop,
    draggedBlocks,
    isCurrentDraggedCanvas,
    isDragging,
    layoutElementPositions,
    mainCanvasLayoutId,
  } = anvilDragStates;
  const dispatch = useDispatch();
  const canvasToLayoutGap = useRef({ left: 0, top: 0 });
  /**
   * Provides auto-scroll functionality
   */
  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas && !activateOverlayWidgetDrop,
    isDragging,
  );

  /**
   * Ref to store highlights derived in real time once dragging starts
   */
  const allHighlightsRef = useRef([] as AnvilHighlightInfo[]);
  const currentLayoutPositions = layoutElementPositions[layoutId];

  /**
   * Function to calculate and store highlights
   */
  const calculateHighlights = () => {
    if (activateOverlayWidgetDrop) {
      allHighlightsRef.current = [];
    } else {
      allHighlightsRef.current = deriveAllHighlightsFn(
        layoutElementPositions,
        draggedBlocks,
      )?.highlights;
    }
  };
  const canvasIsDragging = useRef(false);

  useEffect(() => {
    // Effect to handle changes in isCurrentDraggedCanvas
    if (stickyCanvasRef.current && slidingArenaRef.current) {
      if (!isCurrentDraggedCanvas) {
        // If not currently dragged, reset the canvas and styles
        const canvasCtx = stickyCanvasRef.current.getContext(
          "2d",
        ) as CanvasRenderingContext2D;
        canvasCtx.clearRect(
          0,
          0,
          stickyCanvasRef.current.width,
          stickyCanvasRef.current.height,
        );
        slidingArenaRef.current.style.zIndex = AnvilCanvasZIndex.deactivated;
        stickyCanvasRef.current.style.zIndex = AnvilCanvasZIndex.deactivated;
        slidingArenaRef.current.style.backgroundColor = "unset";
        slidingArenaRef.current.style.color = "unset";
        slidingArenaRef.current.innerText = "";
        canvasIsDragging.current = false;
      } else {
        // If currently dragged, set the z-index to activate the canvas
        slidingArenaRef.current.style.zIndex = AnvilCanvasZIndex.activated;
        stickyCanvasRef.current.style.zIndex = AnvilCanvasZIndex.activated;
      }
    }
  }, [isCurrentDraggedCanvas]);

  useEffect(() => {
    if (slidingArenaRef.current && isDragging) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );

      let currentRectanglesToDraw: AnvilHighlightInfo;
      const scrollObj: any = {};
      const resetCanvasState = () => {
        // Resetting the canvas state when necessary
        if (stickyCanvasRef.current && slidingArenaRef.current) {
          const canvasCtx = stickyCanvasRef.current.getContext(
            "2d",
          ) as CanvasRenderingContext2D;
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          slidingArenaRef.current.style.zIndex = AnvilCanvasZIndex.deactivated;
          slidingArenaRef.current.style.backgroundColor = "unset";
          slidingArenaRef.current.style.color = "unset";
          slidingArenaRef.current.innerText = "";
          canvasIsDragging.current = false;
          dispatch(setHighlightsDrawnAction());
        }
      };

      if (isDragging) {
        const onMouseUp = () => {
          if (
            isDragging &&
            canvasIsDragging.current &&
            currentRectanglesToDraw &&
            !currentRectanglesToDraw.existingPositionHighlight &&
            allowToDrop
          ) {
            // Invoke onDrop callback with the appropriate highlight info
            onDrop(currentRectanglesToDraw);
          }
          resetCanvasState();
        };

        const onFirstMoveOnCanvas = (e: MouseEvent) => {
          if (
            isCurrentDraggedCanvas &&
            isDragging &&
            !canvasIsDragging.current &&
            slidingArenaRef.current
          ) {
            // Calculate highlights when the mouse enters the canvas
            calculateHighlights();
            canvasIsDragging.current = true;
            if (currentLayoutPositions) {
              canvasToLayoutGap.current = computeCanvasToLayoutGap(
                currentLayoutPositions,
                slidingArenaRef.current,
              );
            }
            requestAnimationFrame(() => onMouseMove(e));
          }
        };
        // make sure rendering highlights on canvas and highlighting cell happens once every 50ms
        const throttledRenderOnCanvas = throttle(
          () => {
            if (
              slidingArenaRef.current &&
              stickyCanvasRef.current &&
              canvasIsDragging.current &&
              isCurrentDraggedCanvas
            ) {
              const topOffset = getAbsolutePixels(
                slidingArenaRef.current.getAttribute("topOffset"),
              );
              const leftOffset = getAbsolutePixels(
                slidingArenaRef.current.getAttribute("leftOffset"),
              );
              const { height, posX, posY, width } = currentRectanglesToDraw;
              const left = posX - leftOffset + canvasToLayoutGap.current.left;
              const top = posY - topOffset + canvasToLayoutGap.current.top;
              const edgeOffset = getEdgeHighlightOffset(
                { left, top, width, height },
                currentLayoutPositions,
                canvasToLayoutGap.current,
                currentRectanglesToDraw.isVertical,
              );
              const positionUpdatedHighlightInfo = {
                ...currentRectanglesToDraw,
                posX: left + edgeOffset.leftOffset,
                posY: top + edgeOffset.topOffset,
              };
              dispatch(setHighlightsDrawnAction(positionUpdatedHighlightInfo));
              setHighlightShown(positionUpdatedHighlightInfo);
              // Render blocks on the canvas based on the highlight
              // renderBlocksOnCanvas(
              //   slidingArenaRef.current,
              //   stickyCanvasRef.current,
              //   currentRectanglesToDraw,
              //   currentLayoutPositions,
              //   canvasIsDragging.current,
              //   canvasToLayoutGap.current,
              // );
            }
          },
          50,
          {
            leading: true,
            trailing: true,
          },
        );

        const onMouseMove = (e: any) => {
          if (
            isCurrentDraggedCanvas &&
            canvasIsDragging.current &&
            slidingArenaRef.current &&
            stickyCanvasRef.current
          ) {
            if (!allowToDrop) {
              // Render disallow message if dropping is not allowed
              renderDisallowOnCanvas(slidingArenaRef.current);
              return;
            }
            // Get the closest highlight based on the mouse position
            const processedHighlight = getClosestHighlight(
              e,
              allHighlightsRef.current,
            );
            if (processedHighlight) {
              currentRectanglesToDraw = processedHighlight;
              throttledRenderOnCanvas();
              // Store information for auto-scroll functionality
              scrollObj.lastMouseMoveEvent = {
                offsetX: e.offsetX,
                offsetY: e.offsetY,
              };
              scrollObj.lastScrollTop = scrollParent?.scrollTop;
              scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
            }
          } else {
            // Call onFirstMoveOnCanvas for the initial move on the canvas
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
              // Adjusting mouse position based on scrolling for auto-scroll
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

        if (
          slidingArenaRef.current &&
          stickyCanvasRef.current &&
          scrollParent
        ) {
          // Initialize listeners
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
          // To make sure drops on the main canvas boundary buffer are processed in the capturing phase.
          document.addEventListener("mouseup", onMouseUp, true);
          scrollParent?.addEventListener("scroll", onScroll, false);
        }

        return () => {
          // Cleanup listeners on component unmount
          slidingArenaRef.current?.removeEventListener(
            "mousemove",
            onMouseMove,
          );
          slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
          document.removeEventListener("mouseup", onMouseUp, true);
          scrollParent?.removeEventListener("scroll", onScroll);
        };
      } else {
        // Reset canvas state if not dragging
        resetCanvasState();
      }
    }
  }, [
    isDragging,
    allowToDrop,
    draggedBlocks,
    isCurrentDraggedCanvas,
    isDragging,
    layoutElementPositions,
    mainCanvasLayoutId,
    currentLayoutPositions,
  ]);

  return {
    showCanvas: isDragging && !activateOverlayWidgetDrop,
  };
};
