import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
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
import AlignedColumn from "layoutSystems/anvil/layoutComponents/components/AlignedColumn";
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
export function deriveAlignedColumnHighlights(
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

  const hasFillWidget: boolean = draggedWidgets.some(
    (widget: DraggedWidget) =>
      widget.responsiveBehavior === ResponsiveBehavior.Fill,
  );

  // If layout is empty, add an initial highlight.
  if (!layoutProps.layout?.length) {
    // Assumption: Only drop target layouts are allowed to be empty.
    if (!layoutProps.isDropTarget) return [];
    return getInitialHighlights(
      layoutProps,
      widgetPositions,
      baseHighlight,
      hasFillWidget,
    );
  }

  // Check if layout renders widgets or layouts.
  const rendersWidgets: boolean = AlignedColumn.rendersWidgets(layoutProps);

  // It renders other layouts.
  if (!rendersWidgets) {
    return getHighlightsForLayoutAlignedColumn(
      layoutProps,
      widgetPositions,
      baseHighlight,
      draggedWidgets,
      canvasId,
      layoutOrder,
      hasFillWidget,
    );
  }

  return getHighlightsForWidgetsAlignedColumn(
    layoutProps,
    widgetPositions,
    baseHighlight,
    hasFillWidget,
    draggedWidgets,
  );
}

/**
 * @param layoutProps | LayoutProps : Layout properties.
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @returns AnvilHighlightInfo[] : list of initial highlights at the start position.
 */
export function getInitialHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  hasFillWidget: boolean,
): AnvilHighlightInfo[] {
  const { layoutId, layoutStyle } = layoutProps;
  const alignment: FlexLayerAlignment =
    layoutStyle && layoutStyle["justifyContent"]
      ? (layoutStyle["justifyContent"] as FlexLayerAlignment)
      : FlexLayerAlignment.Start;
  const dimension: PositionData | undefined = widgetPositions[layoutId];
  // If dimensions of layout are not being tracked.
  // return empty array
  if (!dimension) return [];

  /**
   * Return a list of 3 highlights, one for each alignment.
   */
  const { height, width } = dimension;
  const posY: number = getStartPosition(alignment, height);
  return generateAlignedHighlightList(
    {
      ...baseHighlight,
      dropZone: {
        top: posY,
        bottom: posY + height - HIGHLIGHT_SIZE / 2,
      },
      posY,
    },
    width - HIGHLIGHT_SIZE,
    hasFillWidget,
  );
}

/**
 * @param baseHighlight | AnvilHighlightInfo
 * @param height | number
 * @param highlightWidth | number
 * @param posY | number
 * @returns AnvilHighlightInfo[] : list of 3 highlights, one for each alignment.
 */
export function generateAlignedHighlightList(
  baseHighlight: AnvilHighlightInfo,
  totalWidth: number,
  hasFillWidget: boolean,
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
  const width: number = totalWidth / arr.length;
  return arr.map((alignment: FlexLayerAlignment, index: number) => ({
    ...baseHighlight,
    alignment,
    posX: width * index,
    width,
  }));
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

export function getHighlightsForWidgetsAlignedColumn(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  hasFillWidget: boolean,
  draggedWidgets: DraggedWidget[],
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];

  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  const layoutDimensions: PositionData = widgetPositions[layoutProps.layoutId];
  const highlightWidth: number = layoutDimensions.width - HIGHLIGHT_SIZE;

  let index = 0;
  let draggedChildCount = 0;
  for (const each of layout) {
    // Check if current widget is included in the dragged widgets.
    const isDraggedWidget: boolean = draggedWidgets.some(
      (widget: DraggedWidget) => widget.widgetId === each.widgetId,
    );

    const dimension: PositionData | undefined = widgetPositions[each.widgetId];
    if (!dimension) {
      continue;
    }

    const { height, top } = dimension;

    const nextWidgetDimension: PositionData | undefined =
      index === layout.length - 1
        ? undefined
        : widgetPositions[layout[index + 1]?.widgetId];
    const previousWidgetDimension: PositionData | undefined =
      index === 0 ? undefined : widgetPositions[layout[index - 1]?.widgetId];

    if (!isDraggedWidget) {
      highlights.push(
        ...generateAlignedHighlightList(
          {
            ...baseHighlight,
            dropZone: getVerticalDropZone(
              dimension,
              previousWidgetDimension,
              nextWidgetDimension,
            ),
            posY: top - HIGHLIGHT_SIZE / 2,
            rowIndex: index - draggedChildCount,
          },
          highlightWidth,
          hasFillWidget,
        ),
      );
    } else draggedChildCount += 1;

    index += 1;

    if (!nextWidgetDimension) {
      highlights.push(
        ...generateAlignedHighlightList(
          {
            ...baseHighlight,
            dropZone: getFinalVerticalDropZone(dimension, layoutDimensions),
            posY: top + height + HIGHLIGHT_SIZE / 2,
            rowIndex: index - draggedChildCount,
          },
          highlightWidth,
          hasFillWidget,
        ),
      );
    }
  }

  return highlights;
}

/**
 * AlignedColumn renders child layouts.
 * 1. Calculate highlights for each child layout.
 * 2. Add horizontal highlights before every child layout and after the last one.
 * 3. Include highlights of child layout if it is not a drop target.
 * @param layoutProps | LayoutProps : Layout properties.
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param canvasId | string
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @returns AnvilHighlightInfo[] : List of highlights for the layout.
 */
export function getHighlightsForLayoutAlignedColumn(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  canvasId: string,
  layoutOrder: string[],
  hasFillWidget: boolean,
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  const layout: LayoutProps[] = layoutProps.layout as LayoutProps[];
  const updatedOrder: string[] = [...layoutOrder, layoutProps.layoutId];

  const { height: layoutHeight, width: layoutWidth } =
    widgetPositions[layoutProps.layoutId];

  let index = 0;

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
      highlights.push(
        ...generateAlignedHighlightList(
          {
            ...baseHighlight,
            dropZone: getVerticalDropZone(
              widgetPositions[layoutId],
              prevLayoutDimensions,
              nextLayoutDimensions,
            ),
            posY: Math.max(top - HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
            rowIndex: index,
          },
          layoutWidth - HIGHLIGHT_SIZE / 2,
          hasFillWidget,
        ),
      );

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
