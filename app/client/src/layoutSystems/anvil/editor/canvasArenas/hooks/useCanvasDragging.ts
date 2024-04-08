import type React from "react";
import { useEffect, useRef } from "react";
import type { AnvilHighlightingCanvasProps } from "layoutSystems/anvil/editor/canvasArenas/AnvilHighlightingCanvas";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { getAbsolutePixels } from "utils/helpers";
import { getNearestParentCanvas } from "utils/generators";
import { getClosestHighlight } from "./utils";
import { AnvilCanvasZIndex } from "layoutSystems/anvil/editor/canvas/hooks/useCanvasActivation";
import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { useDispatch } from "react-redux";
import { throttle } from "lodash";
import type { LayoutElementPosition } from "layoutSystems/common/types";
import { PADDING_FOR_HORIZONTAL_HIGHLIGHT } from "layoutSystems/anvil/utils/constants";
import memoize from "micro-memoize";

const setHighlightsDrawn = (highlight?: AnvilHighlightInfo) => {
  return {
    type: AnvilReduxActionTypes.ANVIL_SET_HIGHLIGHT_SHOWN,
    payload: {
      highlight,
    },
  };
};

/**
 * Function to render UX to denote that the widget type cannot be dropped in the layout
 */
const renderDisallowOnCanvas = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = "#EB714D";
  slidingArena.style.color = "white";
  slidingArena.innerText = "This Layout doesn't support the widget";

  slidingArena.style.textAlign = "center";
  slidingArena.style.opacity = "0.8";
};

const getDropIndicatorColor = memoize(() => {
  const rootStyles = getComputedStyle(document.documentElement);
  return rootStyles.getPropertyValue("--anvil-drop-indicator");
});

const getEdgeHighlightOffset = (
  highlightPositions: {
    left: number;
    top: number;
    width: number;
    height: number;
  },
  currentLayoutPositions: LayoutElementPosition,
  canvasToLayoutGap: { left: number; top: number },
  isVertical: boolean,
) => {
  const {
    left: highlightLeft,
    top: highlightTop,
    width: highlightWidth,
    height: highlightHeight,
  } = highlightPositions;
  const { width: layoutWidth, height: layoutHeight } = currentLayoutPositions;
  // add offset only for the highlights at the edge of layout
  const isTopEdge = highlightTop === canvasToLayoutGap.top;
  const isLeftEdge = highlightLeft === canvasToLayoutGap.left;
  const isRightEdge =
    highlightLeft + highlightWidth === canvasToLayoutGap.left + layoutWidth;
  const isBottomEdge =
    highlightTop + highlightHeight === canvasToLayoutGap.top + layoutHeight;
  const topGap = (canvasToLayoutGap.top + highlightHeight) * 0.5;
  const leftGap = (canvasToLayoutGap.left + highlightWidth) * 0.5;
  const topOffset = !isVertical
    ? isTopEdge
      ? -topGap
      : isBottomEdge
      ? topGap
      : 0
    : 0;
  const leftOffset = isVertical
    ? isLeftEdge
      ? -leftGap
      : isRightEdge
      ? leftGap
      : 0
    : 0;
  return {
    topOffset,
    leftOffset,
  };
};

/**
 * Function to stroke a rectangle on the canvas that looks like a highlight/drop area.
 */
const renderBlocksOnCanvas = (
  stickyCanvas: HTMLCanvasElement,
  blockToRender: AnvilHighlightInfo,
  currentLayoutPositions: LayoutElementPosition,
  shouldDraw: boolean,
  canvasToLayoutGap: { left: number; top: number },
) => {
  if (!shouldDraw) {
    return;
  }
  // Calculating offset based on the position of the canvas
  const topOffset = getAbsolutePixels(stickyCanvas.style.top);
  const leftOffset = getAbsolutePixels(stickyCanvas.style.left);
  const dropIndicatorColor = getDropIndicatorColor();
  const canvasCtx = stickyCanvas.getContext("2d") as CanvasRenderingContext2D;

  // Clearing previous drawings on the canvas
  canvasCtx.clearRect(0, 0, stickyCanvas.width, stickyCanvas.height);
  canvasCtx.beginPath();

  // Extracting dimensions of the block to render
  const { height, posX, posY, width } = blockToRender;
  const left = posX - leftOffset + canvasToLayoutGap.left;
  const top = posY - topOffset + canvasToLayoutGap.top;
  const edgeOffset = getEdgeHighlightOffset(
    { left, top, width, height },
    currentLayoutPositions,
    canvasToLayoutGap,
    blockToRender.isVertical,
  );
  // using custom function to draw a rounded rectangle to achieve more sharper rounder corners
  const horizontalPadding = blockToRender.isVertical
    ? 0
    : PADDING_FOR_HORIZONTAL_HIGHLIGHT;
  const verticalPadding = blockToRender.isVertical
    ? PADDING_FOR_HORIZONTAL_HIGHLIGHT / 2
    : 0;
  canvasCtx.roundRect(
    left + horizontalPadding + edgeOffset.leftOffset,
    top + verticalPadding + edgeOffset.topOffset,
    width - horizontalPadding * 2,
    height - verticalPadding * 2,
    2,
  );

  canvasCtx.fillStyle = dropIndicatorColor;
  canvasCtx.fill();
  canvasCtx.closePath();
};

const computeCanvasToLayoutGap = (
  layoutPositions: LayoutElementPosition,
  slidingArena: HTMLDivElement,
) => {
  const { height, width } = slidingArena.getBoundingClientRect();
  return {
    top: (height - layoutPositions.height) * 0.5,
    left: (width - layoutPositions.width) * 0.5,
  };
};

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
  const canvasIsDragging = useRef(false);
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
          dispatch(setHighlightsDrawn());
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
              stickyCanvasRef.current &&
              canvasIsDragging.current &&
              isCurrentDraggedCanvas
            ) {
              dispatch(setHighlightsDrawn(currentRectanglesToDraw));
              // Render blocks on the canvas based on the highlight
              renderBlocksOnCanvas(
                stickyCanvasRef.current,
                currentRectanglesToDraw,
                currentLayoutPositions,
                canvasIsDragging.current,
                canvasToLayoutGap.current,
              );
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
              {
                x: e.offsetX - canvasToLayoutGap.current.left,
                y: e.offsetY - canvasToLayoutGap.current.top,
              },
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
