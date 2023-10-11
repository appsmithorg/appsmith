import type { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";
import React from "react";

export interface HighlightingCanvasProps {
  canvasId: string;
  layoutId: string;
  renderOnMouseMove: (e: MouseEvent) => HighlightInfo | undefined;
  onDrop: (renderedBlock: HighlightInfo) => void;
}
type AdditionDataToPassOnDrop = Record<string, any>;
export interface HighlightInfo extends AdditionDataToPassOnDrop {
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
  canvasId,
  layoutId,
  onDrop,
  renderOnMouseMove,
}: HighlightingCanvasProps) {
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showCanvas: showDraggingCanvas } = useCanvasDragging(
    slidingArenaRef,
    stickyCanvasRef,
    {
      canvasId,
      layoutId,
      onDrop,
      renderOnMouseMove,
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
      canvasId={`canvas-dragging-${layoutId}`}
      canvasPadding={0}
      getRelativeScrollingParent={getNearestParentCanvas}
      ref={canvasRef}
      shouldObserveIntersection={isDragging}
      showCanvas={showDraggingCanvas}
      sliderId={`div-dragarena-${layoutId}`}
    />
  ) : null;
}
