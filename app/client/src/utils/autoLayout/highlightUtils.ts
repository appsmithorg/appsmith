import { FlexLayerAlignment } from "components/constants";
import {
  DEFAULT_HIGHLIGHT_SIZE,
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { HighlightInfo } from "pages/common/CanvasArenas/hooks/useAutoLayoutHighlights";
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
  mainCanvasWidth = 0,
  draggedWidgets: string[] = [],
  hasFillWidget = false,
  isMobile = false,
): HighlightInfo[] {
  const widgets = { ...allWidgets };
  try {
    const canvas = widgets[canvasId];
    if (!canvas) return [];

    const { canvasWidth, columnSpace } = getCanvasDimensions(
      canvas,
      widgets,
      mainCanvasWidth,
      isMobile,
    );
    const layers: FlexLayer[] = canvas.flexLayers || [];
    const highlights: HighlightInfo[] = [];
    let childCount = 0;
    let layerIndex = 0;
    // TODO: remove offsetTop and use child positions after widget positioning on grid is solved.
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
        canvasWidth,
        canvasId,
        columnSpace,
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
          ),
        );

        highlights.push(...payload.highlights);
        layerIndex += 1;
      }
      offsetTop += childrenRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT || 0;
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
      ),
    );
    return highlights;
  } catch (e) {
    // console.error(e);
    return [];
  }
}
interface VerticalHighlightsPayload {
  childCount: number;
  highlights: HighlightInfo[];
}

/**
 * Derive highlight information for all widgets within a layer.
 * - Breakdown each layer into component alignments.
 * - generate highlight information for each alignment.
 */
function generateVerticalHighlights(data: {
  widgets: CanvasWidgetsReduxState;
  layer: FlexLayer;
  childCount: number;
  layerIndex: number;
  offsetTop: number;
  canvasWidth: number;
  canvasId: string;
  columnSpace: number;
  draggedWidgets: string[];
  isMobile: boolean;
}): VerticalHighlightsPayload {
  const {
    canvasId,
    canvasWidth,
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

  const highlights: HighlightInfo[] = [];
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
          startColumns > 25 || endColumns > 25 || centerSize === 0;
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
          parentRowSpace: widgets[canvasId].parentRowSpace,
          canvasWidth,
          columnSpace,
          isMobile,
          avoidInitialHighlight,
          startPosition,
        }),
      );
      index += 1;
    }
  }
  return { highlights, childCount: count };
}

/**
 * Generate highlight information for a single alignment within a layer.
 * - For each widget in the alignment
 *   - generate a highlight to mark the the start position of the widget.
 * - Add another highlight at the end position of the last widget in the alignment.
 * - If the alignment has no children, then add an initial highlight to mark the start of the alignment.
 */
function generateHighlightsForAlignment(data: {
  arr: Widget[];
  childCount: number;
  layerIndex: number;
  alignment: FlexLayerAlignment;
  maxHeight: number;
  offsetTop: number;
  canvasId: string;
  parentColumnSpace: number;
  parentRowSpace: number;
  canvasWidth: number;
  columnSpace: number;
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
    columnSpace,
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
        canvasWidth,
        canvasId,
        columnSpace,
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
  containerWidth: number,
  canvasId: string,
  columnSpace: number,
  startPosition: number | undefined,
): number {
  const endPosition =
    64 * columnSpace - (canvasId !== MAIN_CONTAINER_WIDGET_ID ? 4 : 0);
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
): HighlightInfo[] {
  const width = containerWidth / 3;
  const arr: HighlightInfo[] = [];
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
          ? 0
          : containerWidth
        : width * index,
      posY: offsetTop,
      width: hasFillWidget
        ? alignment === FlexLayerAlignment.Start
          ? containerWidth
          : 0
        : width,
      height: DEFAULT_HIGHLIGHT_SIZE,
      isVertical: false,
      canvasId,
    });
  });
  return arr;
}

function getCanvasDimensions(
  canvas: Widget,
  widgets: CanvasWidgetsReduxState,
  mainCanvasWidth: number,
  isMobile: boolean,
): { canvasWidth: number; columnSpace: number } {
  const canvasWidth: number = getCanvasWidth(
    canvas,
    widgets,
    mainCanvasWidth,
    isMobile,
  );

  const columnSpace: number = canvasWidth / GridDefaults.DEFAULT_GRID_COLUMNS;

  return { canvasWidth: canvasWidth, columnSpace };
}

function getCanvasWidth(
  canvas: Widget,
  widgets: CanvasWidgetsReduxState,
  mainCanvasWidth: number,
  isMobile: boolean,
): number {
  if (!mainCanvasWidth) return 0;
  if (canvas.widgetId === MAIN_CONTAINER_WIDGET_ID)
    return mainCanvasWidth - getPadding(canvas);
  let widget = canvas;
  let columns = 0;
  let width = 1;
  let padding = 0;
  while (widget.parentId) {
    columns = getWidgetWidth(widget, isMobile);
    padding += getPadding(widget);
    width *= columns / GridDefaults.DEFAULT_GRID_COLUMNS;
    widget = widgets[widget.parentId];
  }
  const totalWidth = width * mainCanvasWidth;
  if (widget.widgetId === MAIN_CONTAINER_WIDGET_ID)
    padding += getPadding(widget);
  return totalWidth - padding;
}

function getPadding(canvas: Widget): number {
  let padding = 0;
  if (
    canvas.widgetId === MAIN_CONTAINER_WIDGET_ID ||
    canvas.type === "CONTAINER_WIDGET"
  ) {
    //For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
    padding = FLEXBOX_PADDING * 2;
  }
  if (canvas.noPad) {
    // Widgets like ListWidget choose to have no container padding so will only have widget padding
    padding = WIDGET_PADDING * 2;
  }
  // Account for container border.
  padding += canvas.type === "CONTAINER_WIDGET" ? 2 : 0;
  return padding;
}
