import { theme } from "constants/DefaultTheme";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { getIsAutoLayout } from "selectors/editorSelectors";
import type { LayoutDirection } from "utils/autoLayout/constants";
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
}

export function CanvasDraggingArena({
  alignItems,
  canExtend,
  direction,
  dropDisabled = false,
  noPad,
  parentId = "",
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  useAutoLayout,
  widgetId,
  widgetName,
}: CanvasDraggingArenaProps) {
  const isAutoLayout = useSelector(getIsAutoLayout);
  const needsPadding = useMemo(() => {
    return !isAutoLayout && widgetId === MAIN_CONTAINER_WIDGET_ID;
  }, [widgetId, isAutoLayout]);

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
    useAutoLayout,
    widgetId,
    widgetName,
  });
  const canvasRef = React.useRef({
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
