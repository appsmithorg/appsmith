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
  getHighlightsForLayouts,
  getHighlightsForWidgets,
  getInitialHighlights,
} from "./horizontalHighlights";
import { deriveHighlights } from "./highlightUtils";
import type { LayoutElementPositions } from "layoutSystems/common/types";

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
      getInitialHighlights,
      getHighlightsForLayouts,
      getHighlightsForWidgets,
      true,
      hasFillWidget,
    );
  };
