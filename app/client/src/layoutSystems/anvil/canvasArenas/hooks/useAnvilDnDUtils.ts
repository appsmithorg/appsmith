import { useCallback } from "react";
import { getClosestHighlight } from "./utils";
import type { AnvilDnDStates } from "./useAnvilDnDStates";
import { useAnvilWidgetDrop } from "./useAnvilWidgetDrop";

export const useAnvilDnDUtils = (
  canvasId: string,
  anvilDragStates: AnvilDnDStates,
) => {
  const onDrop = useAnvilWidgetDrop(canvasId, anvilDragStates);
  const renderOnMouseMove = useCallback(
    (e: MouseEvent) => {
      return getClosestHighlight(e, anvilDragStates.allHighLights);
    },
    [anvilDragStates.allHighLights],
  );
  return {
    onDrop,
    renderOnMouseMove,
  };
};
