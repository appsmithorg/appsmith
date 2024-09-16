import type { AppState } from "ee/reducers";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import type { LayoutDirection } from "layoutSystems/common/utils/constants";
import { StickyCanvasArena } from "layoutSystems/common/canvasArenas/StickyCanvasArena";

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

/**
 * AutoCanvasDraggingArena is a wrapper for html Canvas on top of the canvas which renders widgets that provides the canvas and logic for drag n drop
 * This Canvas/Arena helps with drag n drop of widgets in AutoLayout and drawing highlights while dragging using useCanvasDragging hook
 * Arenas are basically associated with components involving HTML canvas that is used during dragging, selection etc..
 * @param  AutoCanvasDraggingArenaProps is an object that includes properties like
 * @prop alignItems, defines the alignment of elements on widget canvas
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
  // showDraggingCanvas indicates if the current dragging canvas i.e. the html canvas renders
  const { showCanvas: showDraggingCanvas } = useCanvasDragging(
    slidingArenaRef,
    stickyCanvasRef,
    {
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
    },
  );
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
  return showDraggingCanvas ? (
    <StickyCanvasArena
      canvasId={`canvas-dragging-${widgetId}`}
      canvasPadding={0}
      dependencies={canvasReRenderDependencies}
      getRelativeScrollingParent={getNearestParentCanvas}
      ref={canvasRef}
      shouldObserveIntersection={isDragging}
      showCanvas={showDraggingCanvas}
      sliderId={`div-dragarena-${widgetId}`}
    />
  ) : null;
}
AutoCanvasDraggingArena.displayName = "AutoCanvasDraggingArena";
