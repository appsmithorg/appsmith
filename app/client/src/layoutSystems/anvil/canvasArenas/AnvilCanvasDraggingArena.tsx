import type { AppState } from "@appsmith/reducers";
import React from "react";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";

export interface AnvilCanvasDraggingArenaProps {
  widgetId: string;
  renderOnMouseMove: (e: MouseEvent) => RenderedBlockOnCanvas;
  onDrop: (renderedBlock: RenderedBlockOnCanvas) => void;
}
type AdditionDataToPassOnDrop = Record<string, any>;
export interface RenderedBlockOnCanvas extends AdditionDataToPassOnDrop {
  xPos: number;
  yPos: number;
  width: number;
  height: number;
}

export function AnvilCanvasDraggingArena({
  onDrop,
  renderOnMouseMove,
  widgetId,
}: AnvilCanvasDraggingArenaProps) {
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
  return showDraggingCanvas ? (
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
