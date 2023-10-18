import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";
import React from "react";
import type { AnvilHighlightInfo, DraggedWidget } from "../utils/anvilTypes";
import type { AnvilDnDStates } from "./hooks/useAnvilDnDStates";
import type { LayoutElementPositions } from "layoutSystems/common/types";

export interface AnvilHighlightingCanvasProps {
  anvilDragStates: AnvilDnDStates;
  layoutId: string;
  deriveAllHighlightsFn: (
    layoutElementPositions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ) => AnvilHighlightInfo[];
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}

export function AnvilHighlightingCanvas({
  anvilDragStates,
  deriveAllHighlightsFn,
  layoutId,
  onDrop,
}: AnvilHighlightingCanvasProps) {
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showCanvas: showDraggingCanvas } = useCanvasDragging(
    slidingArenaRef,
    stickyCanvasRef,
    {
      anvilDragStates,
      deriveAllHighlightsFn,
      layoutId,
      onDrop,
    },
  );
  const canvasRef = React.useRef({
    stickyCanvasRef,
    slidingArenaRef,
  });
  return showDraggingCanvas ? (
    <StickyCanvasArena
      canvasId={`canvas-dragging-${layoutId}`}
      canvasPadding={0}
      getRelativeScrollingParent={getNearestParentCanvas}
      ref={canvasRef}
      shouldObserveIntersection={anvilDragStates.isDragging}
      showCanvas={showDraggingCanvas}
      sliderId={`div-dragarena-${layoutId}`}
    />
  ) : null;
}
