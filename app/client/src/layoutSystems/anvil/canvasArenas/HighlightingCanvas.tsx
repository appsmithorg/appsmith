import type { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";
import React from "react";

export interface HighlightingCanvasProps {
  widgetId: string;
  renderOnMouseMove: (e: MouseEvent) => RenderedBlockOnCanvas | undefined;
  onDrop: (renderedBlock: RenderedBlockOnCanvas) => void;
}
type AdditionDataToPassOnDrop = Record<string, any>;
export interface RenderedBlockOnCanvas extends AdditionDataToPassOnDrop {
  posX: number;
  posY: number;
  dropZone: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  width: number;
  height: number;
}

export function HighlightingCanvas({
  onDrop,
  renderOnMouseMove,
  widgetId,
}: HighlightingCanvasProps) {
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showCanvas: showDraggingCanvas } = useCanvasDragging(
    slidingArenaRef,
    stickyCanvasRef,
    {
      onDrop,
      renderOnMouseMove,
      widgetId,
    },
  );
  const canvasRef = React.useRef({
    stickyCanvasRef,
    slidingArenaRef,
  });

  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  return true ? (
    <StickyCanvasArena
      canvasId={`canvas-dragging-${widgetId}`}
      canvasPadding={0}
      getRelativeScrollingParent={getNearestParentCanvas}
      ref={canvasRef}
      shouldObserveIntersection={isDragging}
      showCanvas={showDraggingCanvas}
      sliderId={`div-dragarena-${widgetId}`}
    />
  ) : null;
}
