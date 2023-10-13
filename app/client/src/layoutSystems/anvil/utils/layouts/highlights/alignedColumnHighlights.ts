import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  LayoutProps,
} from "../../anvilTypes";
import { HIGHLIGHT_SIZE } from "../../constants";
import {
  getFinalVerticalDropZone,
  getInitialVerticalDropZone,
  getVerticalDropZone,
} from "./dropZoneUtils";
import {
  getHighlightsForLayouts,
  getHighlightsForWidgets,
  getInitialHighlights,
} from "./horizontalHighlights";
import { deriveHighlights } from "./highlightUtils";
import type {
  WidgetPosition,
  WidgetPositions,
} from "layoutSystems/common/types";

/**
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param canvasId | string
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @returns AnvilHighlightInfo[] : List of highlights for the layout.
 */
export function deriveAlignedColumnHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
): AnvilHighlightInfo[] {
  if (!layoutProps || !widgetPositions || !draggedWidgets.length) return [];

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

  const hasFillWidget: boolean = draggedWidgets.some(
    (widget: DraggedWidget) =>
      widget.responsiveBehavior === ResponsiveBehavior.Fill,
  );

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
    hasFillWidget,
  );
}

function generateHighlights(
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: WidgetPosition,
  currentDimension: WidgetPosition,
  prevDimension: WidgetPosition | undefined,
  nextDimension: WidgetPosition | undefined,
  rowIndex: number,
  isLastHighlight: boolean,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  /**
   * If dragged widgets include a Fill widget,
   * then show a single highlight with start alignment.
   */
  const arr = hasFillWidget
    ? [FlexLayerAlignment.Start]
    : [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ];
  /**
   * For fill widget => single highlight spanning the total width.
   * For hug widget => 3 highlights, one for each alignment. width / 3.
   */
  const width: number = (layoutDimension.width - HIGHLIGHT_SIZE) / arr.length;
  const isInitialHighlight: boolean = rowIndex === 0;
  return arr.map((alignment: FlexLayerAlignment, index: number) => ({
    ...baseHighlight,
    alignment,
    dropZone: isLastHighlight
      ? isInitialHighlight
        ? getInitialVerticalDropZone(currentDimension, layoutDimension)
        : getFinalVerticalDropZone(currentDimension, layoutDimension)
      : getVerticalDropZone(currentDimension, prevDimension, nextDimension),
    posX: width * index,
    posY: isLastHighlight
      ? isInitialHighlight
        ? currentDimension.top
        : Math.min(
            currentDimension.top + currentDimension.height + HIGHLIGHT_SIZE / 2,
            layoutDimension.height - HIGHLIGHT_SIZE / 2,
          )
      : Math.max(currentDimension.top - HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
    rowIndex: rowIndex,
    width,
  }));
}
