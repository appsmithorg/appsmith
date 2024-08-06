import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import WidgetFactory from "WidgetProvider/factory";
import type { HighlightInfo } from "layoutSystems/common/utils/types";
import { useRef } from "react";
import { getIsAutoLayoutMobileBreakPoint } from "selectors/editorSelectors";
import type { WidgetDraggingBlock } from "layoutSystems/common/canvasArenas/ArenaTypes";
import { deriveHighlightsFromLayers } from "layoutSystems/autolayout/utils/highlightUtils";
import type { Point } from "layoutSystems/autolayout/utils/highlightSelectionUtils";
import { getHighlightPayload } from "layoutSystems/autolayout/utils/highlightSelectionUtils";

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

export const useAutoLayoutHighlights = ({
  blocksToDraw,
  canvasId,
  isCurrentDraggedCanvas,
  isDragging,
}: AutoLayoutHighlightProps) => {
  const allWidgets = useSelector(getWidgets);
  const isMobile = useSelector(getIsAutoLayoutMobileBreakPoint);
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
    if (isDragging && isCurrentDraggedCanvas) {
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
