import type { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";
import React from "react";
import type { AnvilHighlightInfo } from "../utils/anvilTypes";

export interface HighlightingCanvasProps {
  anvilDragStates: {
    allowToDrop: boolean;
    isChildOfCanvas: boolean;
    isCurrentDraggedCanvas: boolean;
    isDragging: boolean;
    isNewWidget: boolean;
    isNewWidgetInitialTargetCanvas: boolean;
    isResizing: boolean;
  };
  layoutId: string;
  renderOnMouseMove: (e: MouseEvent) => AnvilHighlightInfo | undefined;
  onDrop: (renderedBlock: AnvilHighlightInfo) => void;
}

export function HighlightingCanvas({
  anvilDragStates,
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
      anvilDragStates,
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
  return showDraggingCanvas ? (
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
