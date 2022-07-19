import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import React, { useMemo } from "react";
import { getNearestParentCanvas } from "utils/generators";
import { useCanvasDragging } from "./hooks/useCanvasDragging";
import { StickyCanvasArena } from "./StickyCanvasArena";

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CanvasDraggingArenaProps {
  canExtend: boolean;
  detachFromLayout?: boolean;
  dropDisabled?: boolean;
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  parentId?: string;
  useAutoLayout?: boolean;
  widgetId: string;
}

export function CanvasDraggingArena({
  canExtend,
  dropDisabled = false,
  noPad,
  parentId = "",
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  useAutoLayout,
  widgetId,
}: CanvasDraggingArenaProps) {
  const needsPadding = useMemo(() => {
    return widgetId === MAIN_CONTAINER_WIDGET_ID;
  }, [widgetId]);

  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const dropPositionRef = React.useRef<HTMLDivElement>(null);
  const { showCanvas } = useCanvasDragging(
    dropPositionRef,
    slidingArenaRef,
    stickyCanvasRef,
    {
      canExtend,
      dropDisabled,
      noPad,
      parentId,
      snapColumnSpace,
      snapRows,
      snapRowSpace,
      useAutoLayout,
      widgetId,
    },
  );
  const canvasRef = React.useRef({
    dropPositionRef,
    stickyCanvasRef,
    slidingArenaRef,
  });
  return showCanvas ? (
    <StickyCanvasArena
      canExtend={canExtend}
      canvasId={`canvas-dragging-${widgetId}`}
      canvasPadding={needsPadding ? theme.canvasBottomPadding : 0}
      getRelativeScrollingParent={getNearestParentCanvas}
      id={`div-dragarena-${widgetId}`}
      ref={canvasRef}
      showCanvas={showCanvas}
      snapColSpace={snapColumnSpace}
      snapRowSpace={snapRowSpace}
      snapRows={snapRows}
    />
  ) : null;
}
CanvasDraggingArena.displayName = "CanvasDraggingArena";
