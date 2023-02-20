import { FlexLayerAlignment } from "utils/autoLayout/constants";
import { DEFAULT_HIGHLIGHT_SIZE } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  getLeftColumn,
  getRightColumn,
  getTopRow,
  getWidgetHeight,
  getWidgetWidth,
} from "./flexWidgetUtils";
import {
  AlignmentInfo,
  getAlignmentSizeInfo,
  getTotalRowsOfAllChildren,
  getWrappedAlignmentInfo,
  Widget,
} from "./positionUtils";
import {
  DropZone,
  FlexLayer,
  HighlightInfo,
  LayerChild,
} from "./autoLayoutTypes";

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
  canvasId: string,
  snapColumnSpace: number,
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

  let offsetTop = FLEXBOX_PADDING; // used to calculate distance of a highlight from parents's top.
  for (const layer of layers) {
    /**
     * If the layer is empty, after discounting the dragged widgets,
     * then don't process it for vertical highlights.
     */
    const isEmpty: boolean =
      layer?.children?.filter(
        (child: LayerChild) => draggedWidgets.indexOf(child.id) === -1,
      ).length === 0;
    const childrenRows = getTotalRowsOfAllChildren(
      widgets,
      layer.children?.map((child) => child.id) || [],
      isMobile,
    );

    const payload: VerticalHighlightsPayload = generateVerticalHighlights({
      widgets,
      layer,
      childCount,
      layerIndex,
      offsetTop,
      canvasId,
      columnSpace: snapColumnSpace,
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
          snapColumnSpace * GridDefaults.DEFAULT_GRID_COLUMNS,
          canvasId,
          hasFillWidget,
          childrenRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
          getPreviousOffsetTop(highlights),
        ),
      );

      highlights.push(...payload.highlights);
      layerIndex += 1;
    } else highlights = updateHorizontalDropZone(highlights);
    offsetTop += childrenRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT || 0;
    childCount += payload.childCount;
  }
  // Add a layer of horizontal highlights for the empty space at the bottom of a stack.
  highlights.push(
    ...generateHorizontalHighlights(
      childCount,
      layerIndex,
      offsetTop,
      snapColumnSpace * GridDefaults.DEFAULT_GRID_COLUMNS,
      canvasId,
      hasFillWidget,
      -1,
      getPreviousOffsetTop(highlights),
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
  layer: FlexLayer;
  childCount: number;
  layerIndex: number;
  offsetTop: number;
  canvasId: string;
  columnSpace: number;
  draggedWidgets: string[];
  isMobile: boolean;
}): VerticalHighlightsPayload {
  const {
    canvasId,
    childCount,
    columnSpace,
    draggedWidgets,
    isMobile,
    layer,
    layerIndex,
    offsetTop,
    widgets,
  } = data;
  const { children } = layer;

  let count = 0;
  const startChildren = [],
    centerChildren = [],
    endChildren = [];
  let startColumns = 0,
    centerColumns = 0,
    endColumns = 0;
  let maxHeight = 0;
  for (const child of children) {
    const widget = widgets[child.id];
    if (!widget) continue;
    count += 1;
    if (draggedWidgets.indexOf(child.id) > -1) continue;
    maxHeight = Math.max(
      maxHeight,
      getWidgetHeight(widget, isMobile) * widget.parentRowSpace,
    );
    if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      endColumns += getWidgetWidth(widget, isMobile);
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
      centerColumns += getWidgetWidth(widget, isMobile);
    } else {
      startChildren.push(widget);
      startColumns += getWidgetWidth(widget, isMobile);
    }
  }

  const alignmentInfo: AlignmentInfo[] = [
    {
      alignment: FlexLayerAlignment.Start,
      children: startChildren,
      columns: startColumns,
    },
    {
      alignment: FlexLayerAlignment.Center,
      children: centerChildren,
      columns: centerColumns,
    },
    {
      alignment: FlexLayerAlignment.End,
      children: endChildren,
      columns: endColumns,
    },
  ];

  const wrappingInfo: AlignmentInfo[][] = isMobile
    ? getWrappedAlignmentInfo(alignmentInfo)
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
      each.reduce((a, b) => a + b.columns, 0) === 0
    )
      continue;
    let index = 0;
    for (const item of each) {
      let avoidInitialHighlight = false;
      let startPosition: number | undefined;
      if (item.alignment === FlexLayerAlignment.Center) {
        const { centerSize } = getAlignmentSizeInfo(each);
        avoidInitialHighlight =
          ((startColumns > 25 || endColumns > 25) && centerColumns === 0) ||
          centerSize === 0;
        if (each.length === 2)
          startPosition =
            index === 0
              ? centerSize / 2
              : GridDefaults.DEFAULT_GRID_COLUMNS - centerSize / 2;
      }
      highlights.push(
        ...generateHighlightsForAlignment({
          arr: item.children,
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
          parentColumnSpace: columnSpace,
          isMobile,
          avoidInitialHighlight,
          startPosition,
        }),
      );
      index += 1;
    }
  }
  highlights = updateVerticalHighlightDropZone(highlights, columnSpace * 64);
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
  arr: Widget[];
  childCount: number;
  layerIndex: number;
  alignment: FlexLayerAlignment;
  maxHeight: number;
  offsetTop: number;
  canvasId: string;
  parentColumnSpace: number;
  avoidInitialHighlight?: boolean;
  isMobile: boolean;
  startPosition: number | undefined;
}): HighlightInfo[] {
  const {
    alignment,
    arr,
    avoidInitialHighlight,
    canvasId,
    childCount,
    isMobile,
    layerIndex,
    maxHeight,
    offsetTop,
    parentColumnSpace,
    startPosition,
  } = data;
  const res: HighlightInfo[] = [];
  let count = 0;
  for (const child of arr) {
    const left = getLeftColumn(child, isMobile);
    res.push({
      isNewLayer: false,
      index: count + childCount,
      layerIndex,
      rowIndex: count,
      alignment,
      posX: left * parentColumnSpace + FLEXBOX_PADDING / 2,
      posY: getTopRow(child, isMobile) * child.parentRowSpace + FLEXBOX_PADDING,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height: isMobile
        ? getWidgetHeight(child, isMobile) * child.parentRowSpace
        : maxHeight,
      isVertical: true,
      canvasId,
      dropZone: {},
    });
    count += 1;
  }

  if (!avoidInitialHighlight) {
    const lastChild: Widget | null =
      arr && arr.length ? arr[arr.length - 1] : null;
    res.push({
      isNewLayer: false,
      index: count + childCount,
      layerIndex,
      rowIndex: count,
      alignment,
      posX: getPositionForInitialHighlight(
        res,
        alignment,
        arr && arr.length
          ? getRightColumn(lastChild, isMobile) * parentColumnSpace +
              FLEXBOX_PADDING / 2
          : 0,
        canvasId,
        parentColumnSpace,
        startPosition,
      ),
      posY:
        lastChild === null
          ? offsetTop
          : getTopRow(lastChild, isMobile) * lastChild?.parentRowSpace +
            FLEXBOX_PADDING,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height:
        isMobile && lastChild !== null
          ? getWidgetHeight(lastChild, isMobile) * lastChild.parentRowSpace
          : maxHeight,
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
  canvasId: string,
  columnSpace: number,
  startPosition: number | undefined,
): number {
  const containerWidth = 64 * columnSpace;
  const endPosition =
    containerWidth +
    (canvasId !== MAIN_CONTAINER_WIDGET_ID
      ? FLEXBOX_PADDING
      : FLEXBOX_PADDING / 2);
  if (alignment === FlexLayerAlignment.End) {
    return endPosition;
  } else if (alignment === FlexLayerAlignment.Center) {
    if (!highlights.length)
      return startPosition !== undefined ? startPosition : containerWidth / 2;
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
): HighlightInfo[] {
  const width = containerWidth / 3;
  const arr: HighlightInfo[] = [];
  const dropZone: DropZone = {
    top: previousOffset === -1 ? offsetTop : (offsetTop - previousOffset) * 0.5,
    bottom: rowHeight === -1 ? 10000 : rowHeight * 0.5,
  };
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
    const leftZone = previousHighlight
      ? (highlight.posX - previousHighlight.posX) * zoneSize
      : highlight.posX + DEFAULT_HIGHLIGHT_SIZE;
    const rightZone = nextHighlight
      ? (nextHighlight.posX - highlight.posX) * zoneSize
      : canvasWidth - highlight.posX;
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
