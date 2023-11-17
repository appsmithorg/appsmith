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
import { AnvilCanvasZIndex } from "./useCanvasActivation";

/**
 * function to render UX to denote that the widget type cannot be dropped in the layout
 */

const renderDisallowOnCanvas = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = "#EB714D";
  slidingArena.style.color = "white";
  slidingArena.innerText = "This Layout doesn't support the widget";

  slidingArena.style.textAlign = "center";
  slidingArena.style.opacity = "0.8";
};

/**
 * function to render UX to denote that the widget can only be dropped on the main canvas
 * and also there would be no highlights for AnvilOverlayWidgetTypes widgets
 */
const renderOverlayWidgetDropLayer = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = "blue";
  slidingArena.style.opacity = "50%";
  slidingArena.style.color = "white";
  slidingArena.innerText = "Pls drop the widget anywhere on the canvas";
};

/**
 * function to stroke a rectangle on the canvas that looks like a highlight/drop area.
 */

const renderBlocksOnCanvas = (
  stickyCanvas: HTMLCanvasElement,
  blockToRender: AnvilHighlightInfo,
) => {
  const topOffset = getAbsolutePixels(stickyCanvas.style.top);
  const leftOffset = getAbsolutePixels(stickyCanvas.style.left);
  const canvasCtx = stickyCanvas.getContext("2d") as CanvasRenderingContext2D;
  canvasCtx.clearRect(0, 0, stickyCanvas.width, stickyCanvas.height);
  canvasCtx.stroke();
  canvasCtx.beginPath();
  canvasCtx.fillStyle = Colors.HIGHLIGHT_FILL;
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = Colors.HIGHLIGHT_OUTLINE;
  canvasCtx.setLineDash([]);
  const { height, posX, posY, width } = blockToRender;
  // roundRect is not currently supported in firefox.
  if (canvasCtx.roundRect) {
    canvasCtx.roundRect(posX - leftOffset, posY - topOffset, width, height, 4);
  } else {
    canvasCtx.rect(posX - leftOffset, posY - topOffset, width, height);
  }
  canvasCtx.fill();
  canvasCtx.stroke();
};

/**
 * Default highlight passed for AnvilOverlayWidgetTypes widgets
 */
const overlayWidgetHighlight: AnvilHighlightInfo = {
  alignment: FlexLayerAlignment.Center,
  canvasId: MAIN_CONTAINER_WIDGET_ID,
  dropZone: {},
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
    draggedBlocks,
    isCurrentDraggedCanvas,
    isDragging,
    isResizing,
    layoutElementPositions,
    mainCanvasLayoutId,
  } = anvilDragStates;
  /**
   * provides auto scroll functionality
   */
  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas && !activateOverlayWidgetDrop,
    isDragging,
  );
  /**
   * ref to store highlights derived in real time once dragging starts
   */
  const allHighlightsRef = useRef([] as AnvilHighlightInfo[]);

  /**
   * function to calculate and store highlights
   */
  const calculateHighlights = () => {
    if (activateOverlayWidgetDrop) {
      allHighlightsRef.current = [];
    } else {
      allHighlightsRef.current = deriveAllHighlightsFn(
        layoutElementPositions,
        draggedBlocks,
      );
    }
  };

  useEffect(() => {
    if (stickyCanvasRef.current && slidingArenaRef.current) {
      if (!anvilDragStates.isCurrentDraggedCanvas) {
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
      } else {
        // z-index was set to 2 but now changed to 10 coz
        // ConnectDataOverlay which wraps widgets like Table for some reasons is absolutely positioned and z-index 9
        slidingArenaRef.current.style.zIndex = AnvilCanvasZIndex.activated;
      }
    }
  }, [anvilDragStates.isCurrentDraggedCanvas]);

  useEffect(() => {
    if (slidingArenaRef.current && !isResizing && isDragging) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );

      let canvasIsDragging = false;
      let currentRectanglesToDraw: AnvilHighlightInfo;
      const scrollObj: any = {};
      const resetCanvasState = () => {
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
          canvasIsDragging = false;
        }
      };

      if (isDragging) {
        const onMouseUp = () => {
          if (
            isDragging &&
            canvasIsDragging &&
            (currentRectanglesToDraw || activateOverlayWidgetDrop) &&
            anvilDragStates.allowToDrop
          ) {
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
            !isResizing &&
            isDragging &&
            !canvasIsDragging &&
            slidingArenaRef.current
          ) {
            // calculate highlights when mouse enters the canvas
            calculateHighlights();
            canvasIsDragging = true;
            onMouseMove(e);
          }
        };

        const onMouseMove = (e: any) => {
          if (
            isDragging &&
            canvasIsDragging &&
            slidingArenaRef.current &&
            stickyCanvasRef.current
          ) {
            if (!anvilDragStates.allowToDrop) {
              renderDisallowOnCanvas(slidingArenaRef.current);
              return;
            }
            if (activateOverlayWidgetDrop) {
              renderOverlayWidgetDropLayer(slidingArenaRef.current);
              return;
            }
            const processedHighlight = getClosestHighlight(
              e,
              allHighlightsRef.current,
            );
            if (processedHighlight) {
              currentRectanglesToDraw = processedHighlight;
              renderBlocksOnCanvas(
                stickyCanvasRef.current,
                currentRectanglesToDraw,
              );
              scrollObj.lastMouseMoveEvent = {
                offsetX: e.offsetX,
                offsetY: e.offsetY,
              };
              scrollObj.lastScrollTop = scrollParent?.scrollTop;
              scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
            }
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

        if (
          slidingArenaRef.current &&
          stickyCanvasRef.current &&
          scrollParent
        ) {
          //Initialize Listeners
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
          // to make sure drops on the main canvas boundary buffer are processed
          document.addEventListener("mouseup", onMouseUp);
          scrollParent?.addEventListener("scroll", onScroll, false);
        }

        return () => {
          slidingArenaRef.current?.removeEventListener(
            "mousemove",
            onMouseMove,
          );
          slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
          document.removeEventListener("mouseup", onMouseUp);
          scrollParent?.removeEventListener("scroll", onScroll);
        };
      } else {
        resetCanvasState();
      }
    }
  }, [isDragging, isResizing, anvilDragStates]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
