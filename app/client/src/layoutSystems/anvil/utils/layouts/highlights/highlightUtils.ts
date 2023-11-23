import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  GetDimensions,
  GetInitialHighlights,
  GetLayoutHighlights,
  GetWidgetHighlights,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { HIGHLIGHT_SIZE } from "../../constants";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { getRelativeDimensions } from "./dimensionUtils";

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param widgetPositions | LayoutElementPositions : positions and dimensions of widgets and layouts.
 * @param canvasId @param canvasId | string : widgetId of parent canvas widget.
 * @param draggedWidgets | string[] : list of widgets that are being dragged.
 * @param layoutOrder | string[] : Hierarchy (Top - down) of layouts.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param parentDropTargetId | string : id of immediate drop target ancestor.
 * @param getInitialHighlights | GetInitialHighlights : method to generate initial highlights for an empty layout.
 * @param getHighlightsForLayouts | GetLayoutHighlights : method to generate highlights for child layouts.
 * @param getHighlightsForWidgets | GetWidgetHighlights : method to generate highlights for child widgets.
 * @param hasAlignments: boolean | whether the layout is aligned.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[]
 */
export function deriveHighlights(
  layoutProps: LayoutProps,
  widgetPositions: LayoutElementPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
  baseHighlight: AnvilHighlightInfo,
  parentDropTargetId: string,
  getInitialHighlights: GetInitialHighlights,
  getHighlightsForLayouts: GetLayoutHighlights,
  getHighlightsForWidgets: GetWidgetHighlights,
  hasAlignments: boolean,
  hasFillWidget?: boolean,
): AnvilHighlightInfo[] {
  const getDimensions: GetDimensions = getRelativeDimensions(widgetPositions);
  // If layout is empty, return an initial set of highlights to demarcate the starting position.
  if (!layoutProps.layout?.length) {
    return getInitialHighlights(
      layoutProps,
      baseHighlight,
      getDimensions,
      !!layoutProps.isDropTarget,
      hasAlignments,
      hasFillWidget,
    );
  }

  // Check if layout renders widgets or layouts.
  const rendersWidgets: boolean = LayoutFactory.doesLayoutRenderWidgets(
    layoutProps.layoutType,
  );

  // It renders other layouts.
  if (!rendersWidgets) {
    /**
     * Calculate and collate highlights for child layouts.
     */
    return getHighlightsForLayouts(
      layoutProps,
      widgetPositions,
      baseHighlight,
      draggedWidgets,
      canvasId,
      layoutOrder,
      parentDropTargetId,
      getDimensions,
      hasAlignments,
      hasFillWidget,
    );
  }
  // Calculate highlights for child widgets.
  return getHighlightsForWidgets(
    layoutProps,
    baseHighlight,
    draggedWidgets,
    getDimensions,
    hasAlignments,
    hasFillWidget,
  );
}

/**
 * @param alignment | FlexLayerAlignment : Alignment of the layout.
 * @param size | number : height / width of the layout.
 * @returns number : Start position of the first highlight.
 */
export function getStartPosition(
  alignment: FlexLayerAlignment,
  size: number,
): number {
  switch (alignment) {
    case FlexLayerAlignment.Center:
      return (size - HIGHLIGHT_SIZE) / 2;
    case FlexLayerAlignment.End:
      return size - HIGHLIGHT_SIZE;
    default:
      return HIGHLIGHT_SIZE / 2;
  }
}

export function getNonDraggedWidgets(
  layout: WidgetLayoutProps[],
  draggedWidgets: DraggedWidget[],
): WidgetLayoutProps[] {
  const draggedWidgetIds: string[] = draggedWidgets.map(
    (each: DraggedWidget) => each.widgetId,
  );

  return layout.filter(
    (each: WidgetLayoutProps) => !draggedWidgetIds.includes(each.widgetId),
  );
}
