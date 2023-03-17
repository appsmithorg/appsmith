import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import { deriveHighlightsFromLayers } from "utils/autoLayout/highlightUtils";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";
import type { Point } from "utils/autoLayout/highlightSelectionUtils";
import { getHighlightPayload } from "utils/autoLayout/highlightSelectionUtils";
import type { HighlightInfo } from "utils/autoLayout/autoLayoutTypes";
import { useRef } from "react";

export interface AutoLayoutHighlightProps {
  blocksToDraw: WidgetDraggingBlock[];
  canvasId: string;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  useAutoLayout?: boolean;
}

export interface HighlightSelectionPayload {
  highlights: HighlightInfo[];
  selectedHighlight: HighlightInfo;
  showNewLayerAlignments?: boolean;
}

export const useAutoLayoutHighlights = ({
  blocksToDraw,
  canvasId,
  isCurrentDraggedCanvas,
  isDragging,
  useAutoLayout,
}: AutoLayoutHighlightProps) => {
  const allWidgets = useSelector(getWidgets);
  const isMobile = useSelector(getIsMobile);
  const highlights = useRef<HighlightInfo[]>([]);
  let lastActiveHighlight: HighlightInfo | undefined;
  let isFillWidget = false;

  /**
   * START AUTO LAYOUT OFFSET CALCULATION
   */

  const cleanUpTempStyles = () => {
    // reset state
    lastActiveHighlight = undefined;
    highlights.current = [];
  };

  const checkForFillWidget = (): boolean => {
    let flag = false;
    if (!blocksToDraw?.length) return flag;
    for (const block of blocksToDraw) {
      const widget = allWidgets[block.widgetId];
      if (widget) {
        if (widget.responsiveBehavior === ResponsiveBehavior.Fill) {
          flag = true;
          break;
        }
        continue;
      }
      const config = WidgetFactory.widgetConfigMap.get(block.type);
      if (config) {
        if (config.responsiveBehavior === ResponsiveBehavior.Fill) {
          flag = true;
          break;
        }
      }
    }
    return flag;
  };

  const calculateHighlights = (snapColumnSpace: number): HighlightInfo[] => {
    cleanUpTempStyles();
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      if (!blocksToDraw || !blocksToDraw.length) return [];
      isFillWidget = checkForFillWidget();
      highlights.current = deriveHighlightsFromLayers(
        allWidgets,
        canvasId,
        snapColumnSpace,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );
    }
    // console.log("#### highlights", highlights.current);
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
  const getDropPosition = (
    snapColumnSpace: number,
    e?: any,
    val?: Point,
    mouseUp = false,
  ) => {
    if (mouseUp && lastActiveHighlight) return lastActiveHighlight;

    if (!highlights || !highlights?.current?.length)
      highlights.current = deriveHighlightsFromLayers(
        allWidgets,
        canvasId,
        snapColumnSpace,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );

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
