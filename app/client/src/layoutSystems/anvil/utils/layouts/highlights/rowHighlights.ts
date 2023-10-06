import Row from "layoutSystems/anvil/layoutComponents/components/Row";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  PositionData,
  WidgetLayoutProps,
  WidgetPositions,
} from "../../anvilTypes";
import {
  HIGHLIGHT_SIZE,
  INFINITE_DROP_ZONE,
  VERTICAL_DROP_ZONE_MULTIPLIER,
} from "../../constants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

export interface RowMetaInformation {
  metaData: RowMetaData[][];
  tallestWidgets: WidgetLayoutProps[];
}

interface RowMetaData extends WidgetLayoutProps, PositionData {}

export function deriveRowHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  canvasId: string,
  layoutOrder: string[] = [],
  // parentWidth?: number,
): AnvilHighlightInfo[] {
  if (!layoutProps || !widgetPositions) return [];

  const rendersWidgets: boolean = Row.rendersWidgets(layoutProps);

  if (!rendersWidgets) return [];

  // Get widget data
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  // Get width of the layout
  // const layoutWidth: number = widgetPositions[layoutProps.layoutId]
  //   ? widgetPositions[layoutProps.layoutId].width
  //   : parentWidth;

  const baseHighlight: AnvilHighlightInfo = {
    alignment: FlexLayerAlignment.Start,
    canvasId,
    dropZone: {},
    height: 0,
    layoutOrder: [...layoutOrder, layoutProps.layoutId],
    posX: 0,
    posY: 0,
    rowIndex: 0,
    width: HIGHLIGHT_SIZE,
  };

  // If there is no widget, add an initial highlight.
  if (!layout?.length) {
    // return initial highlight.
  }

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
        widgetPositions,
        baseHighlight,
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
 * @param widgetPositions | WidgetPositions : Position data of all widgets.
 * @param baseHighlight | AnvilHighlightInfo : Default highlight.
 * @param startingIndex | number : Starting index for the first highlight.
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForRow(
  row: RowMetaData[],
  tallestWidget: WidgetLayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  startingIndex = 0,
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  let index = 0;
  const { height, top } = widgetPositions[tallestWidget.widgetId];
  while (index < row.length) {
    const { alignment, left, width } = row[index];
    // Add a highlight before every widget in the row
    highlights.push({
      ...baseHighlight,
      alignment,
      dropZone: {
        /**
         * Drop zone on either side of the highlight
         * should extend up to 35% of the gap
         * between itself and it's neighbor in that direction.
         */
        left:
          index === 0
            ? INFINITE_DROP_ZONE
            : (left - row[index - 1].left) * VERTICAL_DROP_ZONE_MULTIPLIER,
        right:
          index === row.length - 1
            ? width * VERTICAL_DROP_ZONE_MULTIPLIER
            : (row[index + 1].left - (left + width)) *
              VERTICAL_DROP_ZONE_MULTIPLIER,
      },
      height,
      rowIndex: index + startingIndex,
      posX: left - HIGHLIGHT_SIZE / 2,
      posY: top,
    });

    // Add a highlight after the last widget in the row.
    if (index === row.length - 1) {
      highlights.push({
        ...baseHighlight,
        alignment,
        dropZone: {
          left: width * VERTICAL_DROP_ZONE_MULTIPLIER,
          right: INFINITE_DROP_ZONE,
        },
        height,
        rowIndex: index + startingIndex + 1,
        posX: left + width + HIGHLIGHT_SIZE / 2,
        posY: top,
      });
      break;
    }
    index += 1;
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
