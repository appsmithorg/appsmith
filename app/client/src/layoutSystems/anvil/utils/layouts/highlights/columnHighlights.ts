import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  LayoutProps,
  PositionData,
  WidgetPositions,
} from "../../anvilTypes";
import { HIGHLIGHT_SIZE } from "../../constants";
import {
  getFinalVerticalDropZone,
  getInitialVerticalDropZone,
  getVerticalDropZone,
} from "./dropZoneUtils";
import { deriveHighlights } from "./highlightUtils";
import {
  getHighlightsForLayouts,
  getHighlightsForWidgets,
  getInitialHighlights,
} from "./horizontalHighlights";

/**
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param canvasId | string
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @returns AnvilHighlightInfo[] : List of highlights for the layout.
 */
export function deriveColumnHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
): AnvilHighlightInfo[] {
  if (!layoutProps || !widgetPositions) return [];

  const { layoutStyle } = layoutProps;

  const baseHighlight: AnvilHighlightInfo = {
    alignment:
      layoutStyle && layoutStyle["justifyContent"]
        ? (layoutStyle["justifyContent"] as FlexLayerAlignment)
        : FlexLayerAlignment.Start,
    canvasId,
    dropZone: {},
    height: HIGHLIGHT_SIZE,
    isVertical: false,
    layoutOrder: [...layoutOrder, layoutProps.layoutId],
    posX: HIGHLIGHT_SIZE / 2,
    posY: HIGHLIGHT_SIZE / 2,
    rowIndex: 0,
    width: 0,
  };

  return deriveHighlights(
    layoutProps,
    widgetPositions,
    canvasId,
    draggedWidgets,
    layoutOrder,
    baseHighlight,
    generateHighlights,
    getInitialHighlights,
    getHighlightsForLayouts,
    getHighlightsForWidgets,
  );
}

function generateHighlights(
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: PositionData,
  currentDimension: PositionData,
  prevDimension: PositionData | undefined,
  nextDimension: PositionData | undefined,
  rowIndex: number,
  isLastHighlight: boolean,
): AnvilHighlightInfo[] {
  const isInitialHighlight: boolean = rowIndex === 0;
  return [
    {
      ...baseHighlight,
      dropZone: isLastHighlight
        ? isInitialHighlight
          ? getInitialVerticalDropZone(currentDimension, layoutDimension)
          : getFinalVerticalDropZone(currentDimension, layoutDimension)
        : getVerticalDropZone(currentDimension, prevDimension, nextDimension),
      posY: isLastHighlight
        ? isInitialHighlight
          ? currentDimension.top
          : Math.min(
              currentDimension.top +
                currentDimension.height +
                HIGHLIGHT_SIZE / 2,
              layoutDimension.height - HIGHLIGHT_SIZE / 2,
            )
        : Math.max(
            currentDimension.top - HIGHLIGHT_SIZE / 2,
            HIGHLIGHT_SIZE / 2,
          ),
      rowIndex: rowIndex,
      width: layoutDimension.width - HIGHLIGHT_SIZE,
    },
  ];
}
