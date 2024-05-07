import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  HighlightPayload,
  LayoutProps,
} from "../../anvilTypes";
import { HIGHLIGHT_SIZE } from "../../constants";
import { deriveHighlights } from "./highlightUtils";
import {
  getHighlightsForLayouts,
  getHighlightsForWidgets,
  getInitialHighlights,
} from "./horizontalHighlights";
import type { LayoutElementPositions } from "layoutSystems/common/types";

/**
 * @param layoutProps | LayoutProps
 * @param positions | LayoutElementPositions
 * @param canvasId | string
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @param parentDropTarget | string : id of immediate drop target ancestor.
 * @returns HighlightPayload.
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
  ): HighlightPayload => {
    const { layoutStyle } = layoutProps;

    const baseHighlight: AnvilHighlightInfo = {
      layoutId: layoutProps.layoutId,
      alignment:
        layoutStyle && layoutStyle["justifyContent"]
          ? (layoutStyle["justifyContent"] as FlexLayerAlignment)
          : FlexLayerAlignment.Start,
      canvasId,
      height: HIGHLIGHT_SIZE,
      isVertical: false,
      layoutOrder,
      posX: HIGHLIGHT_SIZE / 2,
      posY: HIGHLIGHT_SIZE / 2,
      rowIndex: 0,
      width: 0,
      edgeDetails: {
        bottom: false,
        left: false,
        right: false,
        top: false,
      },
    };

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
      false,
    );
  };
