import type { AppState } from "@appsmith/reducers";
import React from "react";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import type { LayoutDirection } from "layoutSystems/AutoLayout/utils/constants";
import { StickyCanvasArena } from "layoutSystems/common/CanvasArenas/StickyCanvasArena";

export interface AutoCanvasDraggingArenaProps {
  alignItems?: string;
  canExtend: boolean;
  detachFromLayout?: boolean;
  direction?: LayoutDirection;
  dropDisabled?: boolean;
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  parentId?: string;
  widgetId: string;
  widgetName?: string;
}

export function AutoCanvasDraggingArena({
  alignItems,
  canExtend,
  direction,
  dropDisabled = false,
  noPad,
  parentId = "",
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
  widgetName,
}: AutoCanvasDraggingArenaProps) {
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const { showCanvas } = useCanvasDragging(slidingArenaRef, stickyCanvasRef, {
    alignItems,
    canExtend,
    direction,
    dropDisabled,
    noPad,
    parentId,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
    widgetName,
  });
  const canvasRef = React.useRef({
    stickyCanvasRef,
    slidingArenaRef,
  });

  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  return showCanvas ? (
    <StickyCanvasArena
      canExtend={canExtend}
      canvasId={`canvas-dragging-${widgetId}`}
      canvasPadding={0}
      getRelativeScrollingParent={getNearestParentCanvas}
      id={`div-dragarena-${widgetId}`}
      ref={canvasRef}
      shouldObserveIntersection={isDragging}
      showCanvas={showCanvas}
      snapColSpace={snapColumnSpace}
      snapRowSpace={snapRowSpace}
      snapRows={snapRows}
    />
  ) : null;
}
AutoCanvasDraggingArena.displayName = "AutoCanvasDraggingArena";
