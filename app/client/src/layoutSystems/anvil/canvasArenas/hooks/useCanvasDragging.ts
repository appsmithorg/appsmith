import type React from "react";
import { useEffect, useRef } from "react";
import type { AnvilHighlightingCanvasProps } from "../AnvilHighlightingCanvas";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import { Colors } from "constants/Colors";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { getAbsolutePixels } from "utils/helpers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { getNearestParentCanvas } from "utils/generators";
import { getClosestHighlight } from "./utils";
import { AnvilCanvasZIndex } from "./mainCanvas/useCanvasActivation";
import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import { useDispatch } from "react-redux";
import { throttle } from "lodash";

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

/**
 * Function to render UX to denote that the widget can only be dropped on the main canvas
 * and also there would be no highlights for AnvilOverlayWidgetTypes widgets
 */
const renderOverlayWidgetDropLayer = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = Colors.HIGHLIGHT_FILL;
  slidingArena.style.opacity = "70%";
  slidingArena.style.color = "white";
  slidingArena.innerText = "Please drop the widget here";
  slidingArena.style.display = "flex";
  slidingArena.style.alignItems = "center";
  slidingArena.style.justifyContent = "center";
};

/**
 * Function to stroke a rectangle on the canvas that looks like a highlight/drop area.
 */
const renderBlocksOnCanvas = (
  stickyCanvas: HTMLCanvasElement,
  blockToRender: AnvilHighlightInfo,
  shouldDraw: boolean,
) => {
  if (!shouldDraw) {
    return;
  }
  // Calculating offset based on the position of the canvas
  const topOffset = getAbsolutePixels(stickyCanvas.style.top);
  const leftOffset = getAbsolutePixels(stickyCanvas.style.left);

  const canvasCtx = stickyCanvas.getContext("2d") as CanvasRenderingContext2D;

  // Clearing previous drawings on the canvas
  canvasCtx.clearRect(0, 0, stickyCanvas.width, stickyCanvas.height);
  canvasCtx.stroke();
  canvasCtx.beginPath();

  // Styling the rectangle
  canvasCtx.fillStyle = Colors.HIGHLIGHT_FILL;
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = Colors.HIGHLIGHT_OUTLINE;
  canvasCtx.setLineDash([]);

  // Extracting dimensions of the block to render
  const { height, posX, posY, width } = blockToRender;

  // Drawing a rectangle on the canvas
  if (canvasCtx.roundRect) {
    // Using roundRect method if available (not supported in Firefox)
    canvasCtx.roundRect(posX - leftOffset, posY - topOffset, width, height, 4);
  } else {
    // Using rect method as a fallback
    canvasCtx.rect(posX - leftOffset, posY - topOffset, width, height);
  }

  // Filling and stroking the rectangle
  canvasCtx.fill();
  canvasCtx.stroke();
};

/**
 * Default highlight passed for AnvilOverlayWidgetTypes widgets
 */
const overlayWidgetHighlight: AnvilHighlightInfo = {
  layoutId: "",
  alignment: FlexLayerAlignment.Center,
  canvasId: MAIN_CONTAINER_WIDGET_ID,
  height: 0,
  isVertical: false,
  layoutOrder: [],
  posX: 0,
  posY: 0,
  rowIndex: 0,
  width: 0,
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
  const { anvilDragStates, deriveAllHighlightsFn, onDrop } = props;
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
          dispatch(setHighlightsDrawn());
        }
      };

      if (isDragging) {
        const onMouseUp = () => {
          if (
            isDragging &&
            canvasIsDragging.current &&
            ((currentRectanglesToDraw &&
              !currentRectanglesToDraw.existingPositionHighlight) ||
              activateOverlayWidgetDrop) &&
            allowToDrop
          ) {
            // Invoke onDrop callback with the appropriate highlight info
            onDrop(
              activateOverlayWidgetDrop
                ? {
                    ...overlayWidgetHighlight,
                    layoutOrder: [mainCanvasLayoutId],
                  }
                : currentRectanglesToDraw,
            );
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
            onMouseMove(e);
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
                canvasIsDragging.current,
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
            if (activateOverlayWidgetDrop) {
              // Render overlay widget drop layer if applicable
              renderOverlayWidgetDropLayer(slidingArenaRef.current);
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
    activateOverlayWidgetDrop,
    allowToDrop,
    draggedBlocks,
    isCurrentDraggedCanvas,
    isDragging,
    layoutElementPositions,
    mainCanvasLayoutId,
  ]);

  return {
    showCanvas: isDragging,
  };
};
