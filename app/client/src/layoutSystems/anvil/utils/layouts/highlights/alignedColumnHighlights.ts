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
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";

/**
 * @param layoutProps | LayoutProps
 * @param positions | LayoutElementPositions
 * @param canvasId | string
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @param parentDropTarget | string : id of immediate drop target ancestor.
 * @returns AnvilHighlightInfo[] : List of highlights for the layout.
 */
export const deriveAlignedColumnHighlights =
  (
    layoutProps: LayoutProps,
    canvasId: string,
    layoutOrder: string[],
    parentDropTarget: string,
  ) =>
  (
    positions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ): AnvilHighlightInfo[] => {
    if (
      !layoutProps ||
      !positions ||
      !positions[layoutProps.layoutId] ||
      !draggedWidgets.length
    )
      return [];

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
      layoutOrder,
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
      positions,
      canvasId,
      draggedWidgets,
      layoutOrder,
      baseHighlight,
      parentDropTarget,
      generateHighlights,
      getInitialHighlights,
      getHighlightsForLayouts,
      getHighlightsForWidgets,
      hasFillWidget,
    );
  };

function generateHighlights(
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: LayoutElementPosition,
  currentDimension: LayoutElementPosition,
  prevDimension: LayoutElementPosition | undefined,
  nextDimension: LayoutElementPosition | undefined,
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
        ? // Position values are relative to the MainCanvas. Hence it is important to deduct parent's position from widget's to get a position that is relative to the parent widget.
          Math.max(
            currentDimension.top - layoutDimension.top - HIGHLIGHT_SIZE,
            0,
          )
        : Math.min(
            currentDimension.top -
              layoutDimension.top +
              currentDimension.height +
              HIGHLIGHT_SIZE / 2,
            layoutDimension.height - HIGHLIGHT_SIZE,
          )
      : Math.max(
          currentDimension.top - layoutDimension.top - HIGHLIGHT_SIZE,
          HIGHLIGHT_SIZE / 2,
        ),
    rowIndex: rowIndex,
    width,
  }));
}
