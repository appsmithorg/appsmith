import type { WidgetPositions } from "layoutSystems/common/types";
import React from "react";
import type { AnvilHighlightInfo, DraggedWidget } from "../utils/anvilTypes";
import { AnvilHighlightingCanvas } from "./AnvilHighlightingCanvas";
import { useAnvilDnDStates } from "./hooks/useAnvilDnDStates";
import { useAnvilWidgetDrop } from "./hooks/useAnvilWidgetDrop";
import { useCanvasActivation } from "./hooks/useCanvasActivation";

interface AnvilCanvasDraggingArenaProps {
  canvasId: string;
  layoutId: string;
  allowedWidgetTypes: string[];
  deriveAllHighlightsFn: (
    widgetPositions: WidgetPositions,
    draggedWidgets: DraggedWidget[],
  ) => AnvilHighlightInfo[];
}

export const AnvilCanvasDraggingArena = (
  props: AnvilCanvasDraggingArenaProps,
) => {
  const { allowedWidgetTypes, canvasId, deriveAllHighlightsFn, layoutId } =
    props;
  // useAnvilDnDStates to fetch all states used in Anvil DnD
  const anvilDragStates = useAnvilDnDStates({
    allowedWidgetTypes,
    canvasId,
    layoutId,
  });
  useCanvasActivation(layoutId);
  const onDrop = useAnvilWidgetDrop(canvasId, anvilDragStates);

  return (
    <AnvilHighlightingCanvas
      anvilDragStates={anvilDragStates}
      deriveAllHighlightsFn={deriveAllHighlightsFn}
      layoutId={layoutId}
      onDrop={onDrop}
    />
  );
};
