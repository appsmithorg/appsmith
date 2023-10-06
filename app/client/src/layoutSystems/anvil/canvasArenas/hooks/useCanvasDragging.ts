import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type React from "react";
import { useEffect } from "react";
import { getNearestParentCanvas } from "utils/generators";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import type {
  AnvilCanvasDraggingArenaProps,
  RenderedBlockOnCanvas,
} from "../AnvilCanvasDraggingArena";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import { Colors } from "constants/Colors";
import { useAnvilDnDStates } from "./useAnvilDnDStates";

export const useCanvasDragging = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  { onDrop, renderOnMouseMove, widgetId }: AnvilCanvasDraggingArenaProps,
) => {
  const {
    isChildOfCanvas,
    isCurrentDraggedCanvas,
    isDragging,
    isNewWidget,
    isNewWidgetInitialTargetCanvas,
    isResizing,
  } = useAnvilDnDStates({
    widgetId,
  });

  const { setDraggingCanvas, setDraggingNewWidget, setDraggingState } =
    useWidgetDragResize();

  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas,
    isDragging,
  );

  const renderBlocksOnCanvas = (
    stickyCanvas: HTMLCanvasElement,
    blockToRender: RenderedBlockOnCanvas,
  ) => {
    const canvasCtx: any = stickyCanvas.getContext("2d");
    canvasCtx.fillStyle = Colors.HIGHLIGHT_FILL;
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = Colors.HIGHLIGHT_OUTLINE;
    canvasCtx.setLineDash([]);
    const { height, posX, posY, width } = blockToRender;
    // roundRect is not currently supported in firefox.
    if (canvasCtx.roundRect) canvasCtx.roundRect(posX, posY, width, height, 4);
    else canvasCtx.rect(posX, posY, width, height);
    canvasCtx.fill();
    canvasCtx.stroke();
    canvasCtx.save();
  };

  useEffect(() => {
    if (slidingArenaRef.current && !isResizing && isDragging) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );

      let canvasIsDragging = false;
      let currentRectanglesToDraw: RenderedBlockOnCanvas;
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
        const onMouseUp = () => {
          if (isDragging && canvasIsDragging && currentRectanglesToDraw) {
            onDrop(currentRectanglesToDraw);
          }
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
            if (!isCurrentDraggedCanvas) {
              // we can just use canvasIsDragging but this is needed to render the relative DragLayerComponent
              setDraggingCanvas(widgetId);
            }
            canvasIsDragging = true;
            slidingArenaRef.current.style.zIndex = "2";
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
            currentRectanglesToDraw = renderOnMouseMove(e);
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
  }, [isDragging, isResizing]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};
