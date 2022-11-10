import React from "react";

import { getNearestParentCanvas } from "utils/generators";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { theme } from "constants/DefaultTheme";
import { StickyCanvasArena } from "./StickyCanvasArena";
import { useCanvasSelection } from "./hooks/useCanvasSelection";
import {
  getSlidingCanvasName,
  getStickyCanvasName,
} from "constants/componentClassNameConstants";

export interface SelectedArenaDimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CanvasSelectionArenaProps {
  canExtend: boolean;
  dropDisabled: boolean;
  parentId?: string;
  snapColumnSpace: number;
  widgetId: string;
  snapRows: number;
  snapRowSpace: number;
}

export function CanvasSelectionArena({
  canExtend,
  dropDisabled,
  parentId,
  snapColumnSpace,
  snapRows,
  snapRowSpace,
  widgetId,
}: CanvasSelectionArenaProps) {
  const canvasPadding =
    widgetId === MAIN_CONTAINER_WIDGET_ID ? theme.canvasBottomPadding : 0;
  const slidingArenaRef = React.useRef<HTMLDivElement>(null);
  const stickyCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const { shouldShow } = useCanvasSelection(slidingArenaRef, stickyCanvasRef, {
    canExtend,
    dropDisabled,
    parentId,
    snapColumnSpace,
    snapRows,
    snapRowSpace,
    widgetId,
  });

  const canvasRef = React.useRef({
    slidingArenaRef,
    stickyCanvasRef,
  });
  return shouldShow ? (
    <StickyCanvasArena
      canExtend={canExtend}
      canvasId={getSlidingCanvasName(widgetId)}
      canvasPadding={canvasPadding}
      getRelativeScrollingParent={getNearestParentCanvas}
      id={getStickyCanvasName(widgetId)}
      ref={canvasRef}
      showCanvas={shouldShow}
      snapColSpace={snapColumnSpace}
      snapRowSpace={snapRowSpace}
      snapRows={snapRows}
    />
  ) : null;
}
CanvasSelectionArena.displayName = "CanvasSelectionArena";
