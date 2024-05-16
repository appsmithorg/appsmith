import type React from "react";
import { useEffect, useRef } from "react";
import type { AnvilHighlightingCanvasProps } from "layoutSystems/anvil/editor/canvasArenas/AnvilHighlightingCanvas";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { useAnvilDnDEventCallbacks } from "./useAnvilDnDEventCallbacks";
import { removeDisallowDroppingsUI } from "../utils/utils";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";

/**
 * Hook to handle Anvil DnD events
 */
export const useAnvilDnDEvents = (
  anvilDnDListenerRef: React.RefObject<HTMLDivElement>,
  props: AnvilHighlightingCanvasProps,
  setHighlightShown: (highlight: AnvilHighlightInfo | null) => void,
) => {
  const { anvilDragStates, deriveAllHighlightsFn, layoutId, onDrop } = props;
  const {
    activateOverlayWidgetDrop,
    canActivate,
    isCurrentDraggedCanvas,
    isDragging,
  } = anvilDragStates;
  useCanvasDragToScroll(
    anvilDnDListenerRef,
    isCurrentDraggedCanvas,
    isDragging,
  );
  /**
   * Ref to store highlights derived in real time once dragging starts
   */
  const canvasIsDragging = useRef(false);

  useEffect(() => {
    // Effect to handle changes in isCurrentDraggedCanvas
    if (anvilDnDListenerRef.current) {
      if (!isCurrentDraggedCanvas) {
        removeDisallowDroppingsUI(anvilDnDListenerRef.current);
        canvasIsDragging.current = false;
        setHighlightShown(null);
      }
    }
  }, [isCurrentDraggedCanvas]);
  const { onMouseMove, onMouseOut, onMouseOver, onMouseUp, resetCanvasState } =
    useAnvilDnDEventCallbacks({
      anvilDragStates,
      anvilDnDListenerRef,
      canvasIsDragging,
      deriveAllHighlightsFn,
      layoutId,
      onDrop,
      setHighlightShown,
    });
  useEffect(() => {
    if (anvilDnDListenerRef.current && isDragging) {
      // Initialize listeners
      anvilDnDListenerRef.current?.addEventListener("mouseenter", onMouseOver);
      anvilDnDListenerRef.current.addEventListener("mouseover", onMouseOver);
      anvilDnDListenerRef.current.addEventListener("mouseleave", onMouseOut);
      anvilDnDListenerRef.current.addEventListener("mouseout", onMouseOut);
      anvilDnDListenerRef.current?.addEventListener(
        "mousemove",
        onMouseMove,
        false,
      );
      anvilDnDListenerRef.current?.addEventListener(
        "mouseup",
        onMouseUp,
        false,
      );
      // To make sure drops on the main canvas boundary buffer are processed in the capturing phase.
      document.addEventListener("mouseup", onMouseUp, true);

      return () => {
        anvilDnDListenerRef.current?.removeEventListener(
          "mouseover",
          onMouseOver,
        );
        anvilDnDListenerRef.current?.removeEventListener(
          "mouseenter",
          onMouseOver,
        );
        anvilDnDListenerRef.current?.removeEventListener(
          "mouseleave",
          onMouseOut,
        );
        anvilDnDListenerRef.current?.removeEventListener(
          "mouseout",
          onMouseOut,
        );
        // Cleanup listeners on component unmount
        anvilDnDListenerRef.current?.removeEventListener(
          "mousemove",
          onMouseMove,
        );
        anvilDnDListenerRef.current?.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mouseup", onMouseUp, true);
      };
    } else {
      canvasIsDragging.current = false;
      // Reset canvas state if not dragging
      resetCanvasState();
    }
  }, [
    isDragging,
    onMouseMove,
    onMouseOut,
    onMouseOver,
    onMouseUp,
    resetCanvasState,
  ]);

  return {
    showDnDListener: isDragging && !activateOverlayWidgetDrop && canActivate,
  };
};
