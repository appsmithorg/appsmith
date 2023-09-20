import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import type { HighlightInfo } from "layoutSystems/anvil/utils/autoLayoutTypes";
import { useRef } from "react";
import type { WidgetDraggingBlock } from "layoutSystems/common/CanvasArenas/ArenaTypes";
import type { Point } from "../../../utils/highlightSelectionUtils";
import { getHighlightPayload } from "../../../utils/highlightSelectionUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import Row from "layoutSystems/anvil/layoutComponents/Row";

export interface AutoLayoutHighlightProps {
  blocksToDraw: WidgetDraggingBlock[];
  canvasId: string;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
}

export interface HighlightSelectionPayload {
  highlights: HighlightInfo[];
  selectedHighlight: HighlightInfo;
  showNewLayerAlignments?: boolean;
}

function deriveHighlights(
  allWidgets: CanvasWidgetsReduxState,
  canvasId: string,
): HighlightInfo[] {
  const widgets = { ...allWidgets };
  const canvas = widgets[canvasId];
  if (!canvas) return [];

  // Temporarily derives highlights from Row Layout Component
  return Row.deriveHighlights(canvasId);
}

export const useHighlights = ({
  blocksToDraw,
  canvasId,
  isCurrentDraggedCanvas,
  isDragging,
}: AutoLayoutHighlightProps) => {
  const allWidgets = useSelector(getWidgets);
  const highlights = useRef<HighlightInfo[]>([]);
  let lastActiveHighlight: HighlightInfo | undefined;

  /**
   * START AUTO LAYOUT OFFSET CALCULATION
   */

  const cleanUpTempStyles = () => {
    // reset state
    lastActiveHighlight = undefined;
    highlights.current = [];
  };

  const calculateHighlights = (): HighlightInfo[] => {
    cleanUpTempStyles();
    if (isDragging && isCurrentDraggedCanvas) {
      if (!blocksToDraw || !blocksToDraw.length) return [];
      highlights.current = deriveHighlights(allWidgets, canvasId);
    }
    return highlights.current;
  };

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  /**
   * Highlight a drop position based on mouse position and move direction.
   * @param e | MouseMoveEvent
   * @returns HighlightInfo | undefined
   */
  const getDropPosition = (e?: any, val?: Point, mouseUp = false) => {
    if (mouseUp && lastActiveHighlight) return lastActiveHighlight;

    if (!highlights || !highlights?.current?.length)
      highlights.current = deriveHighlights(allWidgets, canvasId);

    const highlight: HighlightInfo | undefined = getHighlightPayload(
      highlights.current,
      e || null,
      val,
    );
    if (!highlight) return;

    lastActiveHighlight = highlight;
    return highlight;
  };

  return {
    calculateHighlights,
    cleanUpTempStyles,
    getDropPosition,
  };
};
