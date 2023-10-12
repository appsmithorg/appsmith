import type { WidgetPositions } from "layoutSystems/common/types";
import React, { useCallback } from "react";
import type { AnvilHighlightInfo, DraggedWidget } from "../utils/anvilTypes";
import { HighlightingCanvas } from "./HighlightingCanvas";
import { useAnvilDnDStates } from "./hooks/useAnvilDnDStates";
import { useAnvilWidgetDrop } from "./hooks/useAnvilWidgetDrop";
import { getClosestHighlight } from "./utils";

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
  const anvilDragStates = useAnvilDnDStates({
    allowedWidgetTypes,
    deriveAllHighlightsFn,
    canvasId,
    layoutId,
  });

  const onDrop = useAnvilWidgetDrop(canvasId, anvilDragStates);
  const renderOnMouseMove = useCallback(
    (e: MouseEvent) => {
      return getClosestHighlight(e, anvilDragStates.allHighLights);
    },
    [anvilDragStates.allHighLights],
  );
  return (
    <HighlightingCanvas
      anvilDragStates={anvilDragStates}
      layoutId={layoutId}
      onDrop={onDrop}
      renderOnMouseMove={renderOnMouseMove}
    />
  );
};
