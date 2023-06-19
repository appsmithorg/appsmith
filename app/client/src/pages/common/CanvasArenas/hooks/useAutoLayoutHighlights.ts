import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { deriveHighlightsFromLayers } from "utils/autoLayout/highlightUtils";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";
import { getHighlightPayload } from "utils/autoLayout/highlightSelectionUtils";
import type { HighlightInfo } from "utils/autoLayout/autoLayoutTypes";
import { useRef } from "react";
import { getIsAutoLayoutMobileBreakPoint } from "selectors/editorSelectors";
import { GridDefaults } from "constants/WidgetConstants";
import type { AppState } from "@appsmith/reducers";

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
  const widgetPositions = useSelector(
    (state: AppState) => state.entities.widgetPositions,
  );
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
    let left = 0,
      top = 0;

    const mainCanvasElement = document.querySelector(".flex-container-0");
    const currCanvasElement = document.querySelector(
      `.flex-container-${canvasId}`,
    );

    if (mainCanvasElement && currCanvasElement) {
      const { left: mainLeft, top: mainTop } =
        mainCanvasElement.getBoundingClientRect();
      const { left: currLeft, top: currTop } =
        currCanvasElement.getBoundingClientRect();

      left = currLeft - mainLeft;
      top = currTop - mainTop;
    }
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      if (!blocksToDraw || !blocksToDraw.length) return [];
      isFillWidget = checkForFillWidget();
      highlights.current = deriveHighlightsFromLayers(
        allWidgets,
        widgetPositions,
        { left, top },
        canvasId,
        snapColumnSpace * GridDefaults.DEFAULT_GRID_COLUMNS,
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
    delta = { left: 0, top: 0 },
    mouseUp = false,
  ) => {
    if (mouseUp && lastActiveHighlight) return lastActiveHighlight;
    let left = 0,
      top = 0;

    const mainCanvasElement = document.querySelector(".flex-container-0");
    const currCanvasElement = document.querySelector(
      `.flex-container-${canvasId}`,
    );

    if (mainCanvasElement && currCanvasElement) {
      const { left: mainLeft, top: mainTop } =
        mainCanvasElement.getBoundingClientRect();
      const { left: currLeft, top: currTop } =
        currCanvasElement.getBoundingClientRect();

      left = currLeft - mainLeft;
      top = currTop - mainTop;
    }

    if (!highlights || !highlights?.current?.length)
      highlights.current = deriveHighlightsFromLayers(
        allWidgets,
        widgetPositions,
        { left, top },
        canvasId,
        snapColumnSpace * GridDefaults.DEFAULT_GRID_COLUMNS,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );

    const highlight: HighlightInfo | undefined = getHighlightPayload(
      highlights.current,
      delta,
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
