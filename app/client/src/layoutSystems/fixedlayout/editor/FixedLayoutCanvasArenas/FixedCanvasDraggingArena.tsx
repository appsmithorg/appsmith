import type { AppState } from "ee/reducers";
import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";
import React, { useMemo } from "react";
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

/**
 * FixedCanvasDraggingArena is a wrapper for html Canvas on top of the canvas which renders widgets that helps with drag n drop
 * This Canvas/Arena helps with drag n drop of widgets in Fixed Layout while dragging using useCanvasDragging hook
 * Arenas are basically associated with components involving HTML canvas that is used during dragging, selection etc..
 * @param  FixedCanvasDraggingArenaProps is an object that includes properties like
 * @prop canExtend, indicates if the canvas can extend while dragging
 * @prop direction, defines direction of alignment of widgets on canvas
 * @prop dropDisabled, indicates if dragging or dropping on widgets is disabled
 * @prop noPad, indicates if the widget canvas has padding
 * @prop parentId, id of the parent widget of the canvas
 * @prop snapColumnSpace, width between two columns grid
 * @prop snapRows, number of rows in the canvas
 * @prop snapRowSpace, height between two row grid
 * @prop widgetId, id of the current widget canvas associated with current AutoCanvasDraggingArena
 * @prop widgetName, name of the current widget canvas associated with current AutoCanvasDraggingArena
 * @returns
 */
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
  const canvasReRenderDependencies = useMemo(
    () => ({
      canExtend,
      snapColumnSpace,
      snapRowSpace,
      snapRows,
    }),
    [canExtend, snapColumnSpace, snapRowSpace, snapRows],
  );

  return showCanvas ? (
    <StickyCanvasArena
      canvasId={`canvas-dragging-${widgetId}`}
      canvasPadding={needsPadding ? theme.canvasBottomPadding : 0}
      dependencies={canvasReRenderDependencies}
      getRelativeScrollingParent={getNearestParentCanvas}
      ref={canvasRef}
      shouldObserveIntersection={isDragging}
      showCanvas={showCanvas}
      sliderId={`div-dragarena-${widgetId}`}
    />
  ) : null;
}
FixedCanvasDraggingArena.displayName = "FixedCanvasDraggingArena";
