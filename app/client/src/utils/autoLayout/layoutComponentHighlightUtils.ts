/* eslint-disable no-console */
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import type { HighlightInfo, LayoutComponentProps } from "./autoLayoutTypes";
import { FlexLayerAlignment, ResponsiveBehavior } from "./constants";
import { DEFAULT_HIGHLIGHT_SIZE } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  getLayoutComponent,
  updateVerticalDropZoneAndHeight,
} from "./layoutComponentUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

/**
 * Calculates vertical highlights for a Row.
 */
export function getVerticalHighlights(data: {
  layoutProps: LayoutComponentProps;
  widgetPositions: WidgetPositions;
  widgets: CanvasWidgetsReduxState;
  canvasWidth?: number;
  alignment?: FlexLayerAlignment;
  offsetTop?: number;
  parentLayout?: string;
  avoidDropZone?: boolean;
  startPoint?: number;
}): HighlightInfo[] {
  const {
    alignment = FlexLayerAlignment.Start,
    avoidDropZone = false,
    canvasWidth = 0,
    layoutProps,
    offsetTop = 2,
    parentLayout,
    startPoint,
    widgetPositions,
    widgets,
  } = data;
  console.log("####", { data });
  const highlights: HighlightInfo[] = [];
  if (!layoutProps) return highlights;
  const { isDropTarget, layout, layoutId, layoutStyle, rendersWidgets } =
    layoutProps;

  const base = {
    alignment,
    isNewLayer: false,
    isVertical: true,
    layerIndex: 0,
    canvasId: layoutProps.containerProps?.widgetId || "0",
    dropZone: {},
    layoutId,
    width: DEFAULT_HIGHLIGHT_SIZE,
  };

  const parentLeft =
    parentLayout && widgetPositions[parentLayout]
      ? widgetPositions[parentLayout].left
      : 0;
  const layoutWidth: number =
    isDropTarget && widgetPositions[layoutId]
      ? widgetPositions[layoutId].width
      : canvasWidth;
  const layoutHeight: number = widgetPositions[layoutId]
    ? widgetPositions[layoutId].height
    : Math.max(
        parseInt(layoutStyle?.height?.toString() || "0"),
        parseInt(layoutStyle?.minHeight?.toString() || "0"),
      );
  console.log("####", { parentLeft, layoutWidth, layoutHeight });
  /**
   * If layout is empty, return a starting highlight.
   * - If the layout is empty and it exists, it must have a specified height / minHeight.
   */
  if (!layout.length) {
    highlights.push({
      ...base,
      height: Math.max(layoutHeight - DEFAULT_HIGHLIGHT_SIZE, 40),
      index: 0,
      posX:
        startPoint !== undefined
          ? startPoint
          : getEmptyRowStartPositions(alignment, layoutWidth),
      posY: 2,
      rowIndex: 0,
    });
    return avoidDropZone
      ? highlights
      : updateVerticalDropZoneAndHeight(highlights, layoutWidth);
  }

  const minPosX = 0,
    maxPosX = layoutWidth - DEFAULT_HIGHLIGHT_SIZE - 2;
  const maxHeight: number[][] = [[]];
  let wrappedRowIndex = 0;
  let lastBottom = 0;

  if (rendersWidgets) {
    const filteredChildren: string[] = (layout as string[]).filter(
      (id: string, index: number) => {
        const widget = widgetPositions[id];
        if (!widget) return false;
        const { height, top } = widget;
        if (index > 0 && top >= lastBottom) wrappedRowIndex += 1;
        if (!maxHeight[wrappedRowIndex]) maxHeight[wrappedRowIndex] = [height];
        else maxHeight[wrappedRowIndex].push(height);
        if (maxHeight[wrappedRowIndex][0] < height) {
          maxHeight[wrappedRowIndex].fill(
            height,
            0,
            maxHeight[wrappedRowIndex].length - 1,
          );
        }
        lastBottom = top + height;

        return widgetPositions[id];
      },
    );
    wrappedRowIndex = 0;
    let currOffset = offsetTop;
    const arrPosY: number[] = [];
    maxHeight.forEach((each, index) => {
      arrPosY[index] = currOffset;
      currOffset += each[0];
    });
    filteredChildren.forEach((id: string, index: number) => {
      const { left } = widgetPositions[id];
      if (index > maxHeight[wrappedRowIndex].length - 1) wrappedRowIndex += 1;
      highlights.push({
        ...base,
        height: maxHeight[wrappedRowIndex][0],
        index,
        posX: Math.max(left - parentLeft, minPosX),
        posY: arrPosY[wrappedRowIndex],
        rowIndex: index,
      });
      console.log("####", {
        left,
        parentLeft,
        minPosX,
        posX: left - parentLeft,
        arrPosY,
        offsetTop,
        maxHeight,
      });
    });

    const lastWidget =
      widgetPositions[filteredChildren[filteredChildren.length - 1]];
    const { left, width } = lastWidget;
    highlights.push({
      ...base,
      height: maxHeight[wrappedRowIndex][0],
      index: highlights.length,
      posX: Math.min(left + width - parentLeft, maxPosX),
      posY: arrPosY[wrappedRowIndex],
      rowIndex: highlights.length,
    });
    console.log("####", { highlights });
  } else {
    // TODO: add highlights here.
    for (const each of layout as LayoutComponentProps[]) {
      const layoutComp = getLayoutComponent(each.layoutType);
      if (!layoutComp) continue;
      highlights.push(
        layoutComp.deriveHighlights({
          layoutProps: each,
          widgets,
          widgetPositions,
          rect: layoutComp.getDOMRect(each),
        }),
      );
    }
  }
  console.log("!!!!", { highlights });
  return avoidDropZone
    ? highlights
    : updateVerticalDropZoneAndHeight(highlights, layoutWidth);
}

export function getVerticalHighlightsForAlignedRow(data: {
  layoutProps: LayoutComponentProps;
  widgetPositions: WidgetPositions;
  widgets: CanvasWidgetsReduxState;
  canvasWidth?: number;
  parentLayout?: string;
  offsetTop?: number;
}): HighlightInfo[] {
  const highlights: HighlightInfo[] = [];
  const {
    canvasWidth = 0,
    layoutProps,
    offsetTop = 2,
    parentLayout,
    widgetPositions,
    widgets,
  } = data;
  if (!layoutProps) return highlights;

  const { isDropTarget, layout, layoutId, rendersWidgets } = layoutProps;
  const layoutWidth: number =
    isDropTarget && widgetPositions[layoutId]
      ? widgetPositions[layoutId].width
      : canvasWidth;
  if (rendersWidgets) {
    const startChildren = (layout as string[][])[0];
    const centerChildren = (layout as string[][])[1];
    const endChildren = (layout as string[][])[2];
    const sizes = [0, 0, 0];
    const hasFillWidget = [startChildren, centerChildren, endChildren].reduce(
      (acc, curr, index) => {
        return (
          acc ||
          curr.some((id, currIndex) => {
            const widget = widgets[id];
            const position = widgetPositions[id];
            if (position) {
              const { width } = position;
              sizes[index] += width + (currIndex > 0 ? 4 : 0);
            }
            return (
              widget && widget.responsiveBehavior === ResponsiveBehavior.Fill
            );
          })
        );
      },
      false,
    );
    if (hasFillWidget) {
      return getVerticalHighlights({
        ...data,
        alignment: FlexLayerAlignment.Start,
      });
    }

    const wrapInfo: number[][] = getRowWrapInformation(layoutWidth, sizes);
    const alignmentInfo: {
      alignment: FlexLayerAlignment;
      size: number;
      children: string[];
    }[] = [
      {
        alignment: FlexLayerAlignment.Start,
        size: sizes[0],
        children: startChildren,
      },
      {
        alignment: FlexLayerAlignment.Center,
        size: sizes[1],
        children: centerChildren,
      },
      {
        alignment: FlexLayerAlignment.End,
        size: sizes[2],
        children: endChildren,
      },
    ];
    let alignmentIndex = 0;
    for (const each of wrapInfo) {
      const curr = each;
      const arr = getWrappedAlignmentWidth(
        alignmentInfo.slice(alignmentIndex, curr.length),
        layoutWidth,
        [],
      );

      alignmentIndex = curr.length;
      const alignmentSizes = getAlignmentSize(arr);
      while (arr.length) {
        const item = arr.shift();
        highlights.push(
          ...getVerticalHighlights({
            ...data,
            alignment: item.alignment,
            layoutProps: {
              ...layoutProps,
              layout: item.children,
            },
            canvasWidth: layoutWidth,
            offsetTop,
            parentLayout,
            avoidDropZone: true,
            startPoint: getEmptyAlignmentStartPoint(
              item.alignment,
              alignmentSizes.startSize,
              alignmentSizes.centerSize,
              alignmentSizes.endSize,
            ),
          }),
        );
      }
    }
  }
  console.log("!!!!", { highlights });
  return updateVerticalDropZoneAndHeight(highlights, layoutWidth);
}

function getAlignmentSize(arr: any[]): {
  startSize: number;
  centerSize: number;
  endSize: number;
} {
  const map = {
    startSize: 0,
    centerSize: 0,
    endSize: 0,
  };
  arr.forEach((each) => {
    switch (each.alignment) {
      case FlexLayerAlignment.Start:
        map.startSize += each.size;
        break;
      case FlexLayerAlignment.Center:
        map.centerSize += each.size;
        break;
      case FlexLayerAlignment.End:
        map.endSize += each.size;
        break;
      default:
        break;
    }
  });
  return map;
}

function getEmptyRowStartPositions(
  alignment: FlexLayerAlignment,
  width: number,
): number {
  const map: { [key: string]: (width: number) => number } = {
    [FlexLayerAlignment.Start]: () => DEFAULT_HIGHLIGHT_SIZE / 2,
    [FlexLayerAlignment.Center]: (width) => width / 2,
    [FlexLayerAlignment.End]: (width) => width - DEFAULT_HIGHLIGHT_SIZE,
  };
  return map[alignment](width);
}

function getEmptyAlignmentStartPoint(
  alignment: FlexLayerAlignment,
  startSize: number,
  centerSize: number,
  endSize: number,
): number {
  switch (alignment) {
    case FlexLayerAlignment.Start:
      return DEFAULT_HIGHLIGHT_SIZE / 2;
    case FlexLayerAlignment.Center:
      return startSize + centerSize / 2;
    case FlexLayerAlignment.End:
      return startSize + centerSize + endSize - DEFAULT_HIGHLIGHT_SIZE;
    default:
      return DEFAULT_HIGHLIGHT_SIZE / 2;
  }
}

function getRowWrapInformation(
  layoutWidth: number,
  sizes: number[],
): number[][] {
  const arr: number[][] = [];
  let item: number[] = [];
  let currentSize = 0;
  for (const each of sizes) {
    if (each + currentSize > layoutWidth) {
      arr.push(item);
      item = [each];
      currentSize = each;
    } else {
      item.push(each);
      currentSize += each;
    }
  }
  arr.push(item);
  return arr;
}

function getWrappedAlignmentWidth(
  data: any[],
  layoutWidth: number,
  res: any[],
): any[] {
  const result = [...res];
  const arr = [...data].sort((a, b) => b.size - a.size);
  if (arr[0].size > layoutWidth / arr.length) {
    result.push(arr[0]);
    arr.shift();
    return getWrappedAlignmentWidth(
      arr,
      layoutWidth - result[result.length - 1].size,
      result,
    );
  } else {
    for (const each of arr) {
      result.push({ ...each, size: layoutWidth / arr.length });
    }
  }
  return result.sort((a, b) => {
    const map: { [key: string]: number } = {
      [FlexLayerAlignment.Start]: 2,
      [FlexLayerAlignment.Center]: 1,
      [FlexLayerAlignment.End]: 0,
    };
    return map[b.alignment] - map[a.alignment];
  });
}

/**
 * - Parse the layout of widgetIds
 * - For each widget, track the maxHeight encountered.
 * - if widget.top > previousWidget.bottom => flex wrap => multiple rows
 *   => track the maxHeight of the next row separately.
 *
 * Returns the maxHeight of each row and total height of the layout.
 * @param layoutProps | LayoutComponentProps
 * @param widgetPositions | WidgetPositions
 * @returns { rowHeights: number[]; totalHeight: number }
 */
export function getWidgetRowHeight(
  layoutProps: LayoutComponentProps,
  widgetPositions: WidgetPositions,
): { rowHeights: number[]; totalHeight: number } {
  const { layout } = layoutProps;
  // If layout has no children, return the calculated css height.
  if (!layout.length) return { rowHeights: [], totalHeight: 0 };
  // Calculate height from children.
  // Children are widgets
  const maxHeights: number[] = [];
  let lastBottom = 0;
  (layout as string[]).forEach((widgetId: string) => {
    const position = widgetPositions[widgetId];
    if (position) {
      const { height, top } = position;
      if (top >= lastBottom) {
        // If top is below the bottom point of the last widget => flex wrap.
        maxHeights.push(height);
      } else if (height > maxHeights[maxHeights.length - 1]) {
        // TODO: Account for Row gaps.
        // update max height.
        maxHeights[maxHeights.length - 1] = height;
      }
      if (top + height > lastBottom) lastBottom = top + height;
    }
  });
  const widgetHeight = maxHeights.reduce((acc, curr) => acc + curr, 0);
  return {
    totalHeight: widgetHeight,
    rowHeights: maxHeights,
  };
}

export function isRowAligned(
  layout: string[] | string[][] | LayoutComponentProps[],
): boolean {
  return !!layout.length && Array.isArray(layout[0]);
}
