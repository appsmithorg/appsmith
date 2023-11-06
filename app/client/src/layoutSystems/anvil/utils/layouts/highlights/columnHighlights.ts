import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
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
import { deriveHighlights } from "./highlightUtils";
import {
  getHighlightsForLayouts,
  getHighlightsForWidgets,
  getInitialHighlights,
} from "./horizontalHighlights";
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
export const deriveColumnHighlights =
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
          ? Math.max(currentDimension.top - layoutDimension.top, 0)
          : Math.min(
              currentDimension.top +
                currentDimension.height +
                HIGHLIGHT_SIZE / 2 -
                layoutDimension.top,
              layoutDimension.height - HIGHLIGHT_SIZE,
            )
        : Math.max(
            currentDimension.top - layoutDimension.top - HIGHLIGHT_SIZE,
            HIGHLIGHT_SIZE / 2,
          ),
      rowIndex: rowIndex,
      width: layoutDimension.width - HIGHLIGHT_SIZE,
    },
  ];
}
