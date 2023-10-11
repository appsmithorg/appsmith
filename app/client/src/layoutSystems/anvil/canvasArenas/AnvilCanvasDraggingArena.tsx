import type { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import React, { useCallback } from "react";
import type { AnvilHighlightInfo } from "../utils/anvilTypes";
import { HighlightingCanvas } from "./HighlightingCanvas";
import { useAnvilDnDStates } from "./hooks/useAnvilDnDStates";
import { useAnvilWidgetDrop } from "./hooks/useAnvilWidgetDrop";
import { getClosestHighlight } from "./utils";

type AnvilCanvasDraggingArenaProps = {
  canvasId: string;
  layoutId: string;
  allowedWidgetTypes: string[];
  deriveAllHighlightsFn: (
    draggingWidgets: {
      widgetId?: string;
      type: string;
      responsiveBehavior?: ResponsiveBehavior;
    }[],
  ) => AnvilHighlightInfo[];
};

export const AnvilCanvasDraggingArena = (
  props: AnvilCanvasDraggingArenaProps,
) => {
  const { allowedWidgetTypes, canvasId, deriveAllHighlightsFn, layoutId } =
    props;
  const anvilDragStates = useAnvilDnDStates({
    allowedWidgetTypes,
    canvasId,
    layoutId,
  });
  const allHighLights = deriveAllHighlightsFn(anvilDragStates.draggedBlocks);
  const onDrop = useAnvilWidgetDrop(canvasId, anvilDragStates);
  const renderOnMouseMove = useCallback(
    (e: MouseEvent) => {
      return getClosestHighlight(e, allHighLights);
    },
    [allHighLights],
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
