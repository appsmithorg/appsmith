/* eslint-disable no-console */
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { deriveHighlightsFromLayers } from "utils/autoLayout/highlightUtils";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetDraggingBlock } from "../hooks/useBlocksToBeDraggedOnCanvas";
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
  isCurrentDraggedLayout: boolean;
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
  isCurrentDraggedLayout,
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
  let draggedWidgetTypes: string[] = [];
  let currentLayoutId: string | undefined;

  /**
   * START AUTO LAYOUT OFFSET CALCULATION
   */

  const cleanUpTempStyles = () => {
    // reset state
    lastActiveHighlight = undefined;
    highlights.current = [];
  };

  const checkForFillWidget = (): {
    isFillWidget: boolean;
    widgetTypes: string[];
  } => {
    if (!blocksToDraw?.length) return { isFillWidget: false, widgetTypes: [] };
    let flag = false;
    const arr: string[] = [];
    for (const block of blocksToDraw) {
      const widget = allWidgets[block.widgetId];
      arr.push(block.type);
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
    return { isFillWidget: flag, widgetTypes: arr };
  };

  const calculateHighlights = (
    snapColumnSpace: number,
    layoutId?: string,
  ): HighlightInfo[] => {
    cleanUpTempStyles();
    currentLayoutId = layoutId;
    let left = 0,
      top = 0;

    const mainCanvasElement = document.querySelector(".flex-container-0");
    const currCanvasElement = document.querySelector(`#layout-${layoutId}`);

    if (mainCanvasElement && currCanvasElement) {
      const { left: mainLeft, top: mainTop } =
        mainCanvasElement.getBoundingClientRect();
      const { left: currLeft, top: currTop } =
        currCanvasElement.getBoundingClientRect();

      left = currLeft - mainLeft;
      top = currTop - mainTop;
    }

    if (
      useAutoLayout &&
      isDragging &&
      isCurrentDraggedCanvas &&
      isCurrentDraggedLayout
    ) {
      if (!blocksToDraw || !blocksToDraw.length) return [];
      const data: { isFillWidget: boolean; widgetTypes: string[] } =
        checkForFillWidget();
      isFillWidget = data.isFillWidget;
      draggedWidgetTypes = data.widgetTypes;
      highlights.current = deriveHighlightsFromLayers(
        allWidgets,
        widgetPositions,
        { left, top },
        canvasId,
        snapColumnSpace * GridDefaults.DEFAULT_GRID_COLUMNS,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
        currentLayoutId,
        draggedWidgetTypes,
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

    if (!highlights || !highlights?.current?.length) {
      const data: { isFillWidget: boolean; widgetTypes: string[] } =
        checkForFillWidget();
      isFillWidget = data.isFillWidget;
      draggedWidgetTypes = data.widgetTypes;
      highlights.current = deriveHighlightsFromLayers(
        allWidgets,
        widgetPositions,
        { left, top },
        canvasId,
        snapColumnSpace * GridDefaults.DEFAULT_GRID_COLUMNS,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
        currentLayoutId,
        draggedWidgetTypes,
      );
    }

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
