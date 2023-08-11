/* eslint-disable no-console */
import type { AppState } from "@appsmith/reducers";
import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import type { LayoutDirection } from "utils/autoLayout/constants";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./useCanvasDragging";
import { StickyCanvasArena } from "../StickyCanvasArena";

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CanvasDraggingArenaProps {
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
  useAutoLayout?: boolean;
  widgetId: string;
  widgetName?: string;
  layoutId?: string;
}

export function FixedCanvasDraggingArena({
  alignItems,
  canExtend,
  direction,
  dropDisabled = false,
  layoutId,
  noPad,
  parentId = "",
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  useAutoLayout,
  widgetId,
  widgetName,
}: CanvasDraggingArenaProps) {
  const needsPadding = widgetId === MAIN_CONTAINER_WIDGET_ID;

  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const { showCanvas } = useCanvasDragging(slidingArenaRef, stickyCanvasRef, {
    alignItems,
    canExtend,
    direction,
    dropDisabled,
    layoutId,
    noPad,
    parentId,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    useAutoLayout,
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
      canvasId={`canvas-dragging-${widgetId}-${layoutId}`}
      canvasPadding={needsPadding ? theme.canvasBottomPadding : 0}
      getRelativeScrollingParent={getNearestParentCanvas}
      id={`div-dragarena-${widgetId}-${layoutId}`}
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

// CanvasDraggingArena.whyDidYouRender = {
//   logOnDifferentValues: true,
//   customName: "CanvasDraggingArena",
// };
