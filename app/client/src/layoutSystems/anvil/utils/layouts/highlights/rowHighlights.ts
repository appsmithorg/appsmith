import Row from "layoutSystems/anvil/layoutComponents/components/Row";
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
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import {
  getFinalHorizontalDropZone,
  getHorizontalDropZone,
} from "./dropZoneUtils";
import { getStartPosition } from "./highlightUtils";

export interface RowMetaInformation {
  metaData: RowMetaData[][];
  tallestWidgets: WidgetLayoutProps[];
}

interface RowMetaData extends WidgetLayoutProps, PositionData {}

/**
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param canvasId | string
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @returns AnvilHighlightInfo[] : List of highlights for the layout.
 */
export function deriveRowHighlights(
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
    height: 0,
    isVertical: true,
    layoutOrder: [...layoutOrder, layoutProps.layoutId],
    posX: HIGHLIGHT_SIZE / 2,
    posY: HIGHLIGHT_SIZE / 2,
    rowIndex: 0,
    width: HIGHLIGHT_SIZE,
  };

  // If layout is empty, add an initial highlight.
  if (!layoutProps.layout?.length) {
    const initialHighlight: AnvilHighlightInfo = getInitialHighlight(
      layoutProps,
      widgetPositions,
      baseHighlight,
    );
    return [initialHighlight];
  }

  // Check if layout renders widgets or layouts.
  const rendersWidgets: boolean = Row.rendersWidgets(layoutProps);

  // It renders other layouts.
  if (!rendersWidgets) {
    return getHighlightsForLayoutRow(
      layoutProps,
      widgetPositions,
      baseHighlight,
      canvasId,
      draggedWidgets,
      layoutOrder,
    );
  }

  return getHighlightsForWidgetsRow(
    layoutProps,
    widgetPositions,
    baseHighlight,
    draggedWidgets,
  );
}

/**
 * Derive highlights for a row of widgets.
 * 1. Derive meta information about the row.
 *  a. if it is flex wrapped.
 *  b. If yes, then how the widgets are positioned into multiple rows.
 * 2. Calculate highlights for each row of widgets.
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[] : List of dragged widgets.
 * @returns AnvilHighlightInfo[] : List of highlights.
 */
export function getHighlightsForWidgetsRow(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
): AnvilHighlightInfo[] {
  // Get widget data
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  // Extract meta information about row.
  const meta: RowMetaInformation = extractMetaInformation(
    layout,
    widgetPositions,
  );
  // add a highlight before every widget and after the last one.
  const highlights: AnvilHighlightInfo[] = [];
  meta.metaData.forEach((row: RowMetaData[], index: number) => {
    highlights.push(
      ...getHighlightsForRow(
        row,
        meta.tallestWidgets[index],
        layoutProps,
        widgetPositions,
        baseHighlight,
        draggedWidgets,
        highlights.length ? highlights[highlights.length - 1].rowIndex : 0, // Start subsequent wrapped row with the same index as the last index of the previous row.
      ),
    );
  });
  return highlights;
}

/**
 * Compute highlights for a row.
 * @param row | RowMetaData[] : Meta data on all widgets in the current row.
 * @param tallestWidget | WidgetLayoutProps : tallest widget in the current row.
 * @param layoutProps | LayoutProps : Properties of parent layout.
 * @param widgetPositions | WidgetPositions : Position data of all widgets.
 * @param baseHighlight | AnvilHighlightInfo : Default highlight.
 * @param startingIndex | number : Starting index for the first highlight.
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForRow(
  row: RowMetaData[],
  tallestWidget: WidgetLayoutProps,
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  startingIndex = 0,
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  let index = 0;
  let draggedWidgetCount = 0;
  const { height, top } = widgetPositions[tallestWidget.widgetId];

  const layoutDimensions: PositionData = widgetPositions[layoutProps.layoutId];
  while (index < row.length) {
    const { alignment, left, widgetId, width } = row[index];
    const isDraggedWidget: boolean = draggedWidgets.some(
      (widget: DraggedWidget) => widget.widgetId === widgetId,
    );

    // Don't add highlights for widget if it is being dragged.
    if (!isDraggedWidget) {
      const prevWidgetDimensions: PositionData | undefined =
        index === 0 ? undefined : row[index - 1];
      const nextWidgetDimensions: PositionData | undefined =
        index === 0 ? undefined : row[index - 1];
      // Add a highlight before every widget in the row
      highlights.push({
        ...baseHighlight,
        alignment,
        dropZone: getHorizontalDropZone(
          row[index],
          prevWidgetDimensions,
          nextWidgetDimensions,
        ),
        height,
        rowIndex: index + startingIndex - draggedWidgetCount,
        posX: left - HIGHLIGHT_SIZE / 2,
        posY: top,
      });
    } else draggedWidgetCount += 1;

    index += 1;

    // Add a highlight after the last widget in the row.
    if (index === row.length) {
      highlights.push({
        ...baseHighlight,
        alignment,
        dropZone: getFinalHorizontalDropZone(row[index - 1], layoutDimensions),
        height,
        rowIndex: index + startingIndex - draggedWidgetCount,
        posX: left + width + HIGHLIGHT_SIZE / 2,
        posY: top,
      });
      break;
    }
  }
  return highlights;
}

export function extractMetaInformation(
  layout: WidgetLayoutProps[],
  widgetPositions: WidgetPositions,
): RowMetaInformation {
  const data: RowMetaData[][] = [];
  const tallestWidgets: WidgetLayoutProps[] = [];
  let curr: RowMetaData[] = [];
  let currentTallestWidget: WidgetLayoutProps = layout[0];
  let maxHeight = 0;
  for (const each of layout) {
    const dimensions: PositionData = widgetPositions[each.widgetId];
    if (!dimensions) continue;
    const { height, top } = dimensions;
    // If current row is empty, add the widget to it.
    if (!curr.length) {
      curr.push({ ...each, ...dimensions });
      // set maxHeight of current row equal to height of the first widget in the row.
      maxHeight = height;
      currentTallestWidget = each;
      // else check if there is intersection with the last widget in the current row.
    } else if (
      checkIntersection(
        [top, top + height],
        [
          curr[curr.length - 1].top,
          curr[curr.length - 1].top + curr[curr.length - 1].height,
        ],
      )
    ) {
      // If there is intersection, add the widget to the current row.
      curr.push({ ...each, ...dimensions });
      if (height > maxHeight) {
        maxHeight = height;
        currentTallestWidget = each;
      }
      // else start a new row.
    } else {
      // Add the current row to the data.
      data.push(curr);
      // Add the tallest widgets to the tallest widgets array.
      tallestWidgets.push(currentTallestWidget);
      // Reset the current row.
      curr = [{ ...each, ...dimensions }];
      // Reset the max height.
      maxHeight = height;
      currentTallestWidget = each;
    }
  }
  if (curr.length) {
    data.push(curr);
    tallestWidgets.push(currentTallestWidget);
  }
  return { metaData: data, tallestWidgets };
}

export function checkIntersection(a: number[], b: number[]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/**
 * Calculate position of an initial highlight for an empty layout.
 * @param layoutProps | LayoutProps : Layout properties of the layout for which highlights are being derived.
 * @param widgetPositions | WidgetPositions : Widget positions
 * @param baseHighlight | AnvilHighlightInfo : Default base highlight info.
 * @returns AnvilHighlightInfo : Initial highlight or undefined
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

  const { height, top, width } = dimension;
  const posX: number = getStartPosition(alignment, dimension.width);

  return {
    ...baseHighlight,
    alignment,
    dropZone: {
      left: posX,
      right: width - posX,
    },
    height: height,
    posX,
    posY: top,
  };
}

/**
 * This layout renders more layouts.
 * Calculate highlights for each child layout and combine them together.
 * @param layoutProps | LayoutProps
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param canvasId | string
 * @param layoutOrder |string[] : Top - down hierarchy of parent layouts.
 * @returns AnvilHighlightInfo[] : List of highlights
 */
export function getHighlightsForLayoutRow(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  const layout: LayoutProps[] = layoutProps.layout as LayoutProps[];
  const updatedOrder: string[] = [...layoutOrder, layoutProps.layoutId];
  const { width: layoutWidth } = widgetPositions[layoutProps.layoutId];

  let index = 0;
  // Loop over each child layout
  while (index < layout.length) {
    // Extract information on current child layout.
    const { isDropTarget, layoutId, layoutType } = layout[index];

    // Dimensions of the child layout.
    const { height, left, width } = widgetPositions[layoutId];

    // Dimensions of neighboring layouts
    const prevLayoutDimensions: PositionData | undefined =
      index === 0 ? undefined : widgetPositions[layout[index - 1]?.layoutId];
    const nextLayoutDimensions: PositionData | undefined =
      index === layout.length - 1
        ? undefined
        : widgetPositions[layout[index + 1]?.layoutId];

    // Add a highlight before the child layout
    highlights.push({
      ...baseHighlight,
      dropZone: getHorizontalDropZone(
        widgetPositions[layoutId],
        prevLayoutDimensions,
        nextLayoutDimensions,
      ),
      height,
      posX: Math.max(left - HIGHLIGHT_SIZE / 2, HIGHLIGHT_SIZE / 2),
      rowIndex: index,
    });

    /**
     * Add highlights of the child layout if it is not a drop target.
     * because if it is, then it can handle its own drag behavior.
     */
    if (!isDropTarget) {
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

      highlights.push(...layoutHighlights);
    }

    index += 1;

    if (index === layout.length) {
      // Add a highlight for the drop zone below the child layout.
      highlights.push({
        ...baseHighlight,
        dropZone: getFinalHorizontalDropZone(
          widgetPositions[layoutId],
          widgetPositions[layoutProps.layoutId],
        ),
        height,
        posX: Math.min(
          left + width + HIGHLIGHT_SIZE / 2,
          layoutWidth - HIGHLIGHT_SIZE / 2,
        ),
        rowIndex: index,
      });
    }
  }
  return highlights;
}
