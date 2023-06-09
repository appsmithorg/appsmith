import {
  FlexLayerAlignment,
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "utils/autoLayout/constants";
import { DEFAULT_HIGHLIGHT_SIZE } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  AlignmentInfo,
  DropZone,
  FlexLayer,
  HighlightInfo,
  HighlightsAlignmentChildren,
  LayerChild,
} from "./autoLayoutTypes";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";

function getWrappedAlignmentInfo(
  arr: AlignmentInfo[],
  canvasWidth: number,
  res: AlignmentInfo[][] = [[], [], []],
  resIndex = 0,
): AlignmentInfo[][] {
  if (arr.length === 1) {
    res[resIndex].push(arr[0]);
    return res;
  }
  let index = 0;
  let total = 0;
  for (const each of arr) {
    if (total + each.width > canvasWidth) {
      let x = index;
      if (!res[resIndex].length) {
        res[resIndex].push(each);
        x += 1;
      }
      return getWrappedAlignmentInfo(
        [...arr.slice(x)],
        canvasWidth,
        res,
        resIndex + 1,
      );
    }
    total += each.width;
    index += 1;
    res[resIndex].push(each);
  }
  return res;
}

/**
 * @param allWidgets : CanvasWidgetsReduxState
 * @param canvasId : string
 * @param draggedWidgets : string[]
 * @returns widgets: CanvasWidgetsReduxState
 *
 * This function is used to derive highlights from flex layers and stored in widget dsl.
 */
export function deriveHighlightsFromLayers(
  allWidgets: CanvasWidgetsReduxState,
  widgetPositions: WidgetPositions,
  canvasId: string,
  canvasWidth: number,
  draggedWidgets: string[] = [],
  hasFillWidget = false,
  isMobile = false,
): HighlightInfo[] {
  const widgets = { ...allWidgets };
  const canvas = widgets[canvasId];
  if (!canvas) return [];

  const layers: FlexLayer[] = canvas.flexLayers || [];
  let highlights: HighlightInfo[] = [];
  let childCount = 0;
  let layerIndex = 0;

  const rowGap = isMobile ? MOBILE_ROW_GAP : ROW_GAP;

  let offsetTop = FLEXBOX_PADDING; // used to calculate distance of a highlight from parents's top.
  for (const layer of layers) {
    /**
     * Discard widgets that are detached from layout (Modals).
     */
    const updatedLayer: FlexLayer = {
      children: layer?.children?.filter(
        (child: LayerChild) =>
          widgets[child.id] && !widgets[child.id].detachFromLayout,
      ),
    };
    /**
     * If the layer is empty, after discounting the dragged widgets,
     * then don't process it for vertical highlights.
     */
    const isEmpty: boolean =
      updatedLayer?.children?.filter(
        (child: LayerChild) => draggedWidgets.indexOf(child.id) === -1,
      ).length === 0;
    const layerHeight = getTotalRowsOfAllChildren(
      widgets,
      widgetPositions,
      updatedLayer.children?.map((child) => child.id) || [],
    );

    const payload: VerticalHighlightsPayload = generateVerticalHighlights({
      widgets,
      widgetPositions,
      canvasWidth,
      layer: updatedLayer,
      childCount,
      layerIndex,
      offsetTop,
      canvasId,
      draggedWidgets,
      isMobile,
    });

    if (!isEmpty) {
      /**
       * Add a layer of horizontal highlights before each flex layer
       * to account for new vertical drop positions.
       */
      highlights.push(
        ...generateHorizontalHighlights(
          childCount,
          layerIndex,
          offsetTop,
          canvasWidth,
          canvasId,
          hasFillWidget,
          layerHeight,
          getPreviousOffsetTop(highlights),
          isMobile,
        ),
      );

      highlights.push(...payload.highlights);
      layerIndex += 1;
    } else highlights = updateHorizontalDropZone(highlights);
    offsetTop += layerHeight + rowGap || 0;
    childCount += payload.childCount;
  }
  // Add a layer of horizontal highlights for the empty space at the bottom of a stack.
  highlights.push(
    ...generateHorizontalHighlights(
      childCount,
      layerIndex,
      offsetTop,
      canvasWidth,
      canvasId,
      hasFillWidget,
      -1,
      getPreviousOffsetTop(highlights),
      isMobile,
    ),
  );
  return highlights;
}
export interface VerticalHighlightsPayload {
  childCount: number;
  highlights: HighlightInfo[];
}

/**
 * Derive highlight information for all widgets within a layer.
 * - Breakdown each layer into component alignments.
 * - generate highlight information for each alignment.
 */
export function generateVerticalHighlights(data: {
  widgets: CanvasWidgetsReduxState;
  widgetPositions: WidgetPositions;
  canvasWidth: number;
  layer: FlexLayer;
  childCount: number;
  layerIndex: number;
  offsetTop: number;
  canvasId: string;
  draggedWidgets: string[];
  isMobile: boolean;
}): VerticalHighlightsPayload {
  const {
    canvasId,
    canvasWidth,
    childCount,
    draggedWidgets,
    isMobile,
    layer,
    layerIndex,
    offsetTop,
    widgetPositions,
    widgets,
  } = data;
  const { children } = layer;

  let count = 0;
  const startChildren = [],
    centerChildren = [],
    endChildren = [];
  let startWidth = 0,
    centerWidth = 0,
    endWidth = 0;
  let maxHeight = 0;
  for (const child of children) {
    const widget = widgets[child.id];
    if (!widget || !widgetPositions[widget.widgetId]) continue;
    count += 1;
    if (draggedWidgets.indexOf(child.id) > -1) continue;
    const { height, width } = widgetPositions[widget.widgetId];
    maxHeight = Math.max(maxHeight, height);
    if (child.align === FlexLayerAlignment.End) {
      endChildren.push({ widget, width, height });
      endWidth += width;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push({ widget, width, height });
      centerWidth += width;
    } else {
      startChildren.push({ widget, width, height });
      startWidth += width;
    }
  }

  const alignmentInfo: AlignmentInfo[] = [
    {
      alignment: FlexLayerAlignment.Start,
      children: startChildren,
      width: startWidth,
    },
    {
      alignment: FlexLayerAlignment.Center,
      children: centerChildren,
      width: centerWidth,
    },
    {
      alignment: FlexLayerAlignment.End,
      children: endChildren,
      width: endWidth,
    },
  ];

  const wrappingInfo: AlignmentInfo[][] = isMobile
    ? getWrappedAlignmentInfo(alignmentInfo, canvasWidth)
    : [alignmentInfo];

  let highlights: HighlightInfo[] = [];
  for (const each of wrappingInfo) {
    if (!each.length) continue;
    /**
     * On mobile viewport,
     * if the row is wrapped, i.e. it contains less than all three alignments
     * and if total columns required by these alignments are zero;
     * then don't add a highlight for them as they will be squashed.
     */
    if (
      isMobile &&
      each.length < 3 &&
      each.reduce((a, b) => a + b.width, 0) === 0
    )
      continue;
    let index = 0;
    for (const item of each) {
      let avoidInitialHighlight = false;
      let startPosition: number | undefined;
      if (item.alignment === FlexLayerAlignment.Center) {
        const { centerSize } = getAlignmentSizeInfo(each, canvasWidth);
        avoidInitialHighlight =
          ((startWidth / canvasWidth > 0.4 || endWidth / canvasWidth > 0.4) &&
            centerWidth === 0) ||
          centerSize === 0;
        if (each.length === 2)
          startPosition =
            index === 0
              ? centerSize / 2
              : GridDefaults.DEFAULT_GRID_COLUMNS - centerSize / 2;
      }
      highlights.push(
        ...generateHighlightsForAlignment({
          arr: item.children.map(
            (each: HighlightsAlignmentChildren) => each.widget,
          ),
          childCount:
            item.alignment === FlexLayerAlignment.Start
              ? childCount
              : item.alignment === FlexLayerAlignment.Center
              ? childCount + startChildren.length
              : childCount + startChildren.length + centerChildren.length,
          layerIndex,
          alignment: item.alignment,
          maxHeight,
          offsetTop,
          canvasId,
          canvasWidth,
          widgetPositions,
          isMobile,
          avoidInitialHighlight,
          startPosition,
        }),
      );
      index += 1;
    }
  }
  highlights = updateVerticalHighlightDropZone(highlights, canvasWidth);
  return { highlights, childCount: count };
}

/**
 * Generate highlight information for a single alignment within a layer.
 * - For each widget in the alignment
 *   - generate a highlight to mark the the start position of the widget.
 * - Add another highlight at the end position of the last widget in the alignment.
 * - If the alignment has no children, then add an initial highlight to mark the start of the alignment.
 */
export function generateHighlightsForAlignment(data: {
  arr: FlattenedWidgetProps[];
  widgetPositions: WidgetPositions;
  canvasWidth: number;
  childCount: number;
  layerIndex: number;
  alignment: FlexLayerAlignment;
  maxHeight: number;
  offsetTop: number;
  canvasId: string;
  avoidInitialHighlight?: boolean;
  isMobile: boolean;
  startPosition: number | undefined;
}): HighlightInfo[] {
  const {
    alignment,
    arr,
    avoidInitialHighlight,
    canvasId,
    canvasWidth,
    childCount,
    isMobile,
    layerIndex,
    maxHeight,
    offsetTop,
    startPosition,
    widgetPositions,
  } = data;
  const res: HighlightInfo[] = [];
  let count = 0;
  for (const child of arr) {
    if (!widgetPositions[child.widgetId]) continue;
    const { height, left, top } = widgetPositions[child.widgetId];
    res.push({
      isNewLayer: false,
      index: count + childCount,
      layerIndex,
      rowIndex: count,
      alignment,
      posX: left - DEFAULT_HIGHLIGHT_SIZE,
      posY: top,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height: isMobile ? height : maxHeight,
      isVertical: true,
      canvasId,
      dropZone: {},
    });
    count += 1;
  }

  if (!avoidInitialHighlight) {
    const lastChild: FlattenedWidgetProps | null =
      arr && arr.length ? arr[arr.length - 1] : null;
    const { height, left, top, width } =
      widgetPositions[lastChild?.widgetId || ""] || {};
    res.push({
      isNewLayer: false,
      index: count + childCount,
      layerIndex,
      rowIndex: count,
      alignment,
      posX: getPositionForInitialHighlight(
        res,
        alignment,
        lastChild !== null ? left + width : 0,
        canvasWidth,
        startPosition,
      ),
      posY: lastChild === null ? offsetTop : top,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height: isMobile && lastChild !== null ? height : maxHeight,
      isVertical: true,
      canvasId,
      dropZone: {},
    });
  }
  return res;
}

/**
 * Get the position of the initial / final highlight for an alignment.
 * @param highlights | HighlightInfo[] : highlights for the current alignment
 * @param alignment | FlexLayerAlignment : alignment of the current highlights
 * @param posX | number : end position of the last widget in the current alignment. (rightColumn * columnSpace)
 * @param containerWidth | number : width of the container
 * @param canvasId | string : id of the canvas
 * @returns number
 */
function getPositionForInitialHighlight(
  highlights: HighlightInfo[],
  alignment: FlexLayerAlignment,
  posX: number,
  canvasWidth: number,
  startPosition: number | undefined,
): number {
  const endPosition = canvasWidth + FLEXBOX_PADDING / 2;
  if (alignment === FlexLayerAlignment.End) {
    return endPosition;
  } else if (alignment === FlexLayerAlignment.Center) {
    if (!highlights.length)
      return startPosition !== undefined ? startPosition : canvasWidth / 2;
    return Math.min(posX, endPosition);
  } else {
    if (!highlights.length) return 2;
    return Math.min(posX, endPosition);
  }
}

/**
 * Create a layer of horizontal alignments to denote new vertical drop zones.
 *  - if the layer has a fill widget,
 *    - Start alignment spans the entire container width.
 *  - else each layer takes up a third of the container width and are placed side to side.
 * @param childIndex | number : child count of children placed in preceding layers.
 * @param layerIndex | number
 * @param offsetTop | number
 * @param containerWidth | number
 * @param canvasId |
 * @param hasFillWidget | boolean : whether the layer has a fill widget or not.
 * @returns HighlightInfo[]
 */
function generateHorizontalHighlights(
  childIndex: number,
  layerIndex: number,
  offsetTop: number,
  containerWidth: number,
  canvasId: string,
  hasFillWidget: boolean,
  rowHeight: number,
  previousOffset: number,
  isMobile: boolean,
): HighlightInfo[] {
  const width = containerWidth / 3;
  const arr: HighlightInfo[] = [];
  const dropZone: DropZone = {
    top: previousOffset === -1 ? offsetTop : (offsetTop - previousOffset) * 0.5,
    bottom: rowHeight === -1 ? 10000 : rowHeight * 0.5,
  };
  const rowGap = isMobile ? MOBILE_ROW_GAP : ROW_GAP;
  offsetTop = previousOffset === -1 ? offsetTop : offsetTop - rowGap;
  [
    FlexLayerAlignment.Start,
    FlexLayerAlignment.Center,
    FlexLayerAlignment.End,
  ].forEach((alignment, index) => {
    arr.push({
      isNewLayer: true,
      index: childIndex,
      layerIndex,
      rowIndex: 0,
      alignment,
      posX: hasFillWidget
        ? alignment === FlexLayerAlignment.Start
          ? canvasId === MAIN_CONTAINER_WIDGET_ID
            ? FLEXBOX_PADDING
            : FLEXBOX_PADDING * 1.5
          : containerWidth
        : width * index + FLEXBOX_PADDING,
      posY: offsetTop,
      width: hasFillWidget
        ? alignment === FlexLayerAlignment.Start
          ? containerWidth -
            (canvasId === MAIN_CONTAINER_WIDGET_ID ? 0 : FLEXBOX_PADDING)
          : 0
        : width,
      height: DEFAULT_HIGHLIGHT_SIZE,
      isVertical: false,
      canvasId,
      dropZone,
    });
  });
  return arr;
}

/**
 * Calculate drop zones for vertical highlights.
 * Drop zone of vertical highlights span 35% of the distance between two consecutive highlights.
 * @param highlights | HighlightInfo[] : array of highlights to be updated.
 * @param canvasWidth | number : width of the canvas.
 * @returns HighlightInfo[] : updated highlights.
 */
function updateVerticalHighlightDropZone(
  highlights: HighlightInfo[],
  canvasWidth: number,
): HighlightInfo[] {
  const zoneSize = 0.35;
  for (const [index, highlight] of highlights.entries()) {
    const nextHighlight: HighlightInfo | undefined = highlights[index + 1];
    const previousHighlight: HighlightInfo | undefined = highlights[index - 1];
    const leftZone = Math.max(
      previousHighlight
        ? (highlight.posX -
            (highlight.posY < previousHighlight.posY + previousHighlight.height
              ? previousHighlight.posX
              : 0)) *
            zoneSize
        : highlight.posX + DEFAULT_HIGHLIGHT_SIZE,
      DEFAULT_HIGHLIGHT_SIZE,
    );
    const rightZone = Math.max(
      nextHighlight
        ? ((highlight.posY + highlight.height > nextHighlight.posY
            ? nextHighlight.posX
            : canvasWidth) -
            highlight.posX) *
            zoneSize
        : canvasWidth - highlight.posX,
      DEFAULT_HIGHLIGHT_SIZE,
    );
    highlights[index] = {
      ...highlight,
      dropZone: {
        left: leftZone,
        right: rightZone,
      },
    };
  }
  return highlights;
}

/**
 * Update drop zones for horizontal highlights of the last row.
 * Normally, bottom drop zone of a horizontal highlights spans 50% of the row height.
 * However, if the next row of horizontal highlights is omitted on account of the dragged widgets,
 * then update the previous row's bottom drop zone to span 100% of the row height.
 * @param highlights | HighlightInfo[] : array of highlights to be updated.
 * @returns HighlightInfo[] : updated highlights.
 */
function updateHorizontalDropZone(
  highlights: HighlightInfo[],
): HighlightInfo[] {
  let index = highlights.length - 1;
  while (index >= 0 && highlights[index].isVertical) {
    index -= 1;
  }
  if (index < 0) return highlights;
  const dropZone = {
    top: highlights[index].dropZone.top,
    bottom: (highlights[index]?.dropZone?.bottom || 5) * 2,
  };
  const updatedHighlights: HighlightInfo[] = [
    ...highlights.slice(0, index - 2),
    {
      ...highlights[index - 2],
      dropZone,
    },
    {
      ...highlights[index - 1],
      dropZone,
    },
    {
      ...highlights[index],
      dropZone,
    },
    ...highlights.slice(index + 1),
  ];
  return updatedHighlights;
}

function getPreviousOffsetTop(highlights: HighlightInfo[]): number {
  if (!highlights.length) return -1;
  let index = highlights.length - 1;
  while (highlights[index].isVertical) {
    index--;
  }
  return highlights[index].posY + highlights[index].height;
}

function getTotalRowsOfAllChildren(
  widgets: CanvasWidgetsReduxState,
  widgetPositions: WidgetPositions,
  children: string[],
): number {
  if (!children || !children.length) return 0;
  let top = 10000,
    bottom = 0;
  for (const childId of children) {
    const child = widgets[childId];
    if (!child || !widgetPositions[child.widgetId]) continue;

    const { height, top: widgetTop } = widgetPositions[child.widgetId];
    top = Math.min(top, widgetTop);
    bottom = Math.max(bottom, widgetTop + height);
  }
  return bottom - top;
}

function getAlignmentSizes(
  input: AlignmentInfo[],
  canvasWidth: number,
  sizes: AlignmentInfo[] = [],
): AlignmentInfo[] {
  if (input.length === 0) return sizes;
  const arr: AlignmentInfo[] = [...input].sort((a, b) => b.width - a.width);
  if (arr[0].width > canvasWidth / arr.length) {
    sizes.push(arr[0]);
    arr.shift();
    return getAlignmentSizes(
      arr,
      canvasWidth - sizes[sizes.length - 1].width,
      sizes,
    );
  } else {
    for (let i = 0; i < arr.length; i++) {
      sizes.push({ ...arr[i], width: canvasWidth / arr.length });
    }
  }
  return sizes;
}

function getAlignmentSizeInfo(
  arr: AlignmentInfo[],
  canvasWidth: number,
): {
  startSize: number;
  centerSize: number;
  endSize: number;
} {
  let startSize = 0,
    centerSize = 0,
    endSize = 0;
  const sizes: {
    alignment: FlexLayerAlignment;
    width: number;
  }[] = getAlignmentSizes(arr, canvasWidth, []);

  for (const each of sizes) {
    if (each.alignment === FlexLayerAlignment.Start) {
      startSize = each.width;
    } else if (each.alignment === FlexLayerAlignment.Center) {
      centerSize = each.width;
    } else if (each.alignment === FlexLayerAlignment.End) {
      endSize = each.width;
    }
  }
  return { startSize, centerSize, endSize };
}
