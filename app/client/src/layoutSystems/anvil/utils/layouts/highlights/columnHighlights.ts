import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  LayoutComponent,
  LayoutProps,
  PositionData,
  WidgetLayoutProps,
  WidgetPositions,
} from "../../anvilTypes";
import { HIGHLIGHT_SIZE } from "../../constants";
import Column from "layoutSystems/anvil/layoutComponents/components/Column";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { getFinalVerticalDropZone, getVerticalDropZone } from "./common";

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

  const baseHighlight: AnvilHighlightInfo = {
    alignment: FlexLayerAlignment.Start,
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

  // If layout is empty, add an initial highlight.
  if (!layoutProps.layout?.length) {
    // Assumption: Only drop target layouts are allowed to be empty.
    if (!layoutProps.isDropTarget) return [];
    const initialHighlight: AnvilHighlightInfo = getInitialHighlight(
      layoutProps,
      widgetPositions,
      baseHighlight,
    );
    return [initialHighlight];
  }

  // Check if layout renders widgets or layouts.
  const rendersWidgets: boolean = Column.rendersWidgets(layoutProps);

  // It renders other layouts.
  if (!rendersWidgets) {
    return getHighlightsForLayoutColumn(
      layoutProps,
      widgetPositions,
      baseHighlight,
      draggedWidgets,
      canvasId,
      layoutOrder,
    );
  }

  return getHighlightsForWidgetsColumn(
    layoutProps,
    widgetPositions,
    baseHighlight,
    draggedWidgets,
  ); //
}

/**
 * Calculate position of an initial highlight for an empty layout.
 * @param layoutProps | LayoutProps : Layout properties of the layout for which highlights are being derived.
 * @param widgetPositions | WidgetPositions : Widget positions
 * @param baseHighlight | AnvilHighlightInfo : Default base highlight info.
 * @returns AnvilHighlightInfo | undefined : Initial highlight or undefined
 */
export function getInitialHighlight(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
): AnvilHighlightInfo {
  const { layoutId, layoutStyle } = layoutProps;
  const alignment: FlexLayerAlignment =
    layoutStyle && layoutStyle["justifyContent"]
      ? (layoutStyle["justifyContent"] as FlexLayerAlignment)
      : FlexLayerAlignment.Start;
  const dimension: PositionData = widgetPositions[layoutId];

  const { height, width } = dimension;
  const posY: number = getStartPosition(alignment, height);
  return {
    ...baseHighlight,
    dropZone: {
      top: posY,
      bottom: posY + height - HIGHLIGHT_SIZE / 2,
    },
    posY,
    width: width - HIGHLIGHT_SIZE,
  };
}

/**
 * @param alignment | FlexLayerAlignment : Alignment of the layout.
 * @param height | number : height of the layout.
 * @returns number : Start position of the first highlight.
 */
export function getStartPosition(
  alignment: FlexLayerAlignment,
  height: number,
): number {
  switch (alignment) {
    case FlexLayerAlignment.Center:
      return (height - HIGHLIGHT_SIZE) / 2;
    case FlexLayerAlignment.End:
      return height - HIGHLIGHT_SIZE / 2;
    default:
      return HIGHLIGHT_SIZE / 2;
  }
}

/**
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo : base highlight template for this layout.
 * @param draggedWidgets | DraggedWidget[] : List of widgets currently being dragged.
 * @returns AnvilHighlightInfo[] : List of highlights
 */
export function getHighlightsForWidgetsColumn(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];

  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  const layoutDimensions: PositionData = widgetPositions[layoutProps.layoutId];

  let index = 0;
  let draggedChildCount = 0;
  while (index < layout.length) {
    const widgetId: string = layout[index].widgetId;
    const dimension: PositionData | undefined = widgetPositions[widgetId];
    if (!dimension) {
      index += 1;
      continue;
    }

    // Check if current widget is included in the dragged widgets.
    const isDraggedWidget: boolean = draggedWidgets.some(
      (widget: DraggedWidget) => widget.widgetId === widgetId,
    );

    const { height, top } = dimension;

    const nextWidgetDimension: PositionData | undefined =
      index === layout.length - 1
        ? undefined
        : widgetPositions[layout[index + 1]?.widgetId];
    const previousWidgetDimension: PositionData | undefined =
      index === 0 ? undefined : widgetPositions[layout[index - 1]?.widgetId];

    // If the widget is dragged, don't add a highlight for it.
    if (!isDraggedWidget) {
      highlights.push({
        ...baseHighlight,
        dropZone: getVerticalDropZone(
          dimension,
          previousWidgetDimension,
          nextWidgetDimension,
        ),
        posY: Math.min(top - HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
        rowIndex: index - draggedChildCount,
        width: layoutDimensions.width - HIGHLIGHT_SIZE,
      });
    } else draggedChildCount += 1; // Update the dragged widget count.

    index += 1;

    if (index === layout.length) {
      highlights.push({
        ...baseHighlight,
        dropZone: getFinalVerticalDropZone(
          dimension,
          widgetPositions[layoutProps.layoutId],
        ),
        posY: Math.max(top + height + HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
        rowIndex: index - draggedChildCount,
        width: layoutDimensions.width - HIGHLIGHT_SIZE,
      });
    }
  }

  return highlights;
}

/**
 * Column renders layouts.
 * Calculate highlights for all involved layouts and collate them into a single list.
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[]
 * @param canvasId | string
 * @param layoutOrder | string[]
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForLayoutColumn(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  canvasId: string,
  layoutOrder: string[],
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  const layout: LayoutProps[] = layoutProps.layout as LayoutProps[];
  const updatedOrder: string[] = [...layoutOrder, layoutProps.layoutId];

  const { height: layoutHeight, width: layoutWidth } =
    widgetPositions[layoutProps.layoutId];

  let index = 0;
  // Loop over each child layout
  while (index < layout.length) {
    // Extract information on current child layout.
    const { isDropTarget, layoutId, layoutType } = layout[index];

    // Get current child layout component,
    const Comp: LayoutComponent = LayoutFactory.get(layoutType);
    if (!Comp) continue;
    // Calculate highlights for the layout component.
    const layoutHighlights: AnvilHighlightInfo[] = Comp.deriveHighlights(
      layout[index],
      widgetPositions,
      canvasId,
      draggedWidgets,
      updatedOrder,
    );

    const { height, top } = widgetPositions[layoutId];

    const prevLayoutDimensions: PositionData | undefined =
      index === 0 ? undefined : widgetPositions[layout[index - 1]?.layoutId];
    const nextLayoutDimensions: PositionData | undefined =
      index === layout.length - 1
        ? undefined
        : widgetPositions[layout[index + 1]?.layoutId];

    /**
     * Add highlights for the child layout if it is not a drop target.
     * because if it is, then it can handle its own drag behavior.
     */
    if (!isDropTarget) {
      // Add a highlight for the drop zone above the child layout.
      highlights.push({
        ...baseHighlight,
        dropZone: getVerticalDropZone(
          widgetPositions[layoutId],
          prevLayoutDimensions,
          nextLayoutDimensions,
        ),
        posY: Math.max(top - HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
        rowIndex: index,
        width: layoutWidth - HIGHLIGHT_SIZE,
      });

      highlights.push(...layoutHighlights);
    }

    index += 1;

    if (index === layout.length) {
      // Add a highlight for the drop zone below the child layout.
      highlights.push({
        ...baseHighlight,
        dropZone: getFinalVerticalDropZone(
          widgetPositions[layoutId],
          widgetPositions[layoutProps.layoutId],
        ),
        posY: Math.max(
          top + height + HIGHLIGHT_SIZE / 2,
          layoutHeight - HIGHLIGHT_SIZE / 2,
        ),
        rowIndex: index,
        width: layoutWidth - HIGHLIGHT_SIZE,
      });
    }
  }
  return highlights;
}
