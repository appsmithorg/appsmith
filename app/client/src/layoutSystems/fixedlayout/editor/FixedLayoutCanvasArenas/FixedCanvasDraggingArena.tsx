import type { AppState } from "@appsmith/reducers";
import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { StickyCanvasArena } from "layoutSystems/common/CanvasArenas/StickyCanvasArena";
import React from "react";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";

export interface FixedCanvasDraggingArenaProps {
  canExtend: boolean;
  detachFromLayout?: boolean;
  dropDisabled?: boolean;
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  parentId?: string;
  widgetId: string;
  widgetName?: string;
}

export function FixedCanvasDraggingArena({
  canExtend,
  dropDisabled = false,
  noPad,
  parentId = "",
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
  widgetName,
}: FixedCanvasDraggingArenaProps) {
  const needsPadding = widgetId === MAIN_CONTAINER_WIDGET_ID;

  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const { showCanvas } = useCanvasDragging(slidingArenaRef, stickyCanvasRef, {
    canExtend,
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
      canvasPadding={needsPadding ? theme.canvasBottomPadding : 0}
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
FixedCanvasDraggingArena.displayName = "FixedCanvasDraggingArena";
