import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  GenerateHighlights,
  GetInitialHighlights,
  GetLayoutHighlights,
  GetWidgetHighlights,
  LayoutComponent,
  LayoutProps,
} from "../../anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { HIGHLIGHT_SIZE } from "../../constants";
import type { WidgetPositions } from "layoutSystems/common/types";

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param widgetPositions | WidgetPositions : positions and dimensions of widgets and layouts.
 * @param canvasId @param canvasId | string : widgetId of parent canvas widget.
 * @param draggedWidgets | string[] : list of widgets that are being dragged.
 * @param layoutOrder | string[] : Hierarchy (Top - down) of layouts.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param generateHighlights | GenerateHighlights : method to generate highlights for the parent layout.
 * @param getInitialHighlights | GetInitialHighlights : method to generate initial highlights for an empty layout.
 * @param getHighlightsForLayouts | GetLayoutHighlights : method to generate highlights for child layouts.
 * @param getHighlightsForWidgets | GetWidgetHighlights : method to generate highlights for child widgets.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[]
 */
export function deriveHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
  baseHighlight: AnvilHighlightInfo,
  generateHighlights: GenerateHighlights,
  getInitialHighlights: GetInitialHighlights,
  getHighlightsForLayouts: GetLayoutHighlights,
  getHighlightsForWidgets: GetWidgetHighlights,
  hasFillWidget?: boolean,
): AnvilHighlightInfo[] {
  // If layout is empty, return an initial set of highlights to demarcate the starting position.
  if (!layoutProps.layout?.length) {
    return getInitialHighlights(
      layoutProps,
      widgetPositions,
      baseHighlight,
      generateHighlights,
      hasFillWidget,
    );
  }

  // Check if layout renders widgets or layouts.
  const Comp: LayoutComponent = LayoutFactory.get(layoutProps.layoutType);
  const rendersWidgets: boolean = Comp.rendersWidgets(layoutProps);

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
      generateHighlights,
      hasFillWidget,
    );
  }
  // Calculate highlights for child widgets.
  return getHighlightsForWidgets(
    layoutProps,
    widgetPositions,
    baseHighlight,
    draggedWidgets,
    generateHighlights,
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
