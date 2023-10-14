import { useCallback } from "react";
import { getClosestHighlight } from "./utils";
import type { AnvilDnDStates } from "./useAnvilDnDStates";
import { useAnvilWidgetDrop } from "./useAnvilWidgetDrop";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";

export const useAnvilDnDUtils = (
  canvasId: string,
  anvilDragStates: AnvilDnDStates,
) => {
  const onDrop = useAnvilWidgetDrop(canvasId, anvilDragStates);
  const renderOnMouseMove = useCallback(
    (e: MouseEvent, allHighLights: AnvilHighlightInfo[]) => {
      return getClosestHighlight(e, allHighLights);
    },
    [],
  );
  return {
    onDrop,
    renderOnMouseMove,
  };
};
