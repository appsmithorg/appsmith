import { FlexLayerAlignment } from "components/constants";
import {
  DEFAULT_HIGHLIGHT_SIZE,
  FlexLayer,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { HighlightInfo } from "pages/common/CanvasArenas/hooks/useAutoLayoutHighlights";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

const HORIZONTAL_HIGHLIGHT_MARGIN = 4;

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
): HighlightInfo[] {
  const widgets = { ...allWidgets };
  try {
    const canvas = widgets[canvasId];
    if (!canvas) return [];

    const columns: number = canvas.rightColumn - canvas.leftColumn;

    let padding = (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2;
    if (
      canvas.widgetId === MAIN_CONTAINER_WIDGET_ID ||
      canvas.type === "CONTAINER_WIDGET"
    ) {
      //For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
      padding = CONTAINER_GRID_PADDING * 2;
    }
    if (canvas.noPad) {
      // Widgets like ListWidget choose to have no container padding so will only have widget padding
      padding = WIDGET_PADDING * 2;
    }
    const columnSpace: number =
      canvas.parentColumnSpace === 1
        ? canvas.parentId
          ? (widgets[canvas.parentId].parentColumnSpace * columns -
              (padding || 0)) /
            GridDefaults.DEFAULT_GRID_COLUMNS
          : mainCanvasWidth / GridDefaults.DEFAULT_GRID_COLUMNS
        : canvas.parentColumnSpace;
    // const columnSpace = canvasWidth / GridDefaults.DEFAULT_GRID_COLUMNS;
    const canvasWidth: number =
      canvasId === MAIN_CONTAINER_WIDGET_ID
        ? mainCanvasWidth
        : columns * columnSpace - padding;

    const layers: FlexLayer[] = canvas.flexLayers || [];
    const highlights: HighlightInfo[] = [];
    let childCount = 0;
    let layerIndex = 0;
    // TODO: remove offsetTop and use child positions after widget positioning on grid is solved.
    let offsetTop = HORIZONTAL_HIGHLIGHT_MARGIN; // used to calculate distance of a highlight from parents's top.
    for (const layer of layers) {
      /**
       * If the layer is empty, after discounting the dragged widgets,
       * then don't process it for vertical highlights.
       */
      // const isEmpty =
      //   layer?.children?.filter(
      //     (child: LayerChild) => draggedWidgets.indexOf(child.id) === -1,
      //   ).length === 0;
      const tallestChild = layer.children?.reduce((acc, child) => {
        const widget = widgets[child.id];
        return Math.max(
          acc,
          (widget.bottomRow - widget.topRow) * widget.parentRowSpace,
        );
      }, 0);

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
        ),
      );
      const payload: VerticalHighlightsPayload = generateVerticalHighlights({
        widgets,
        layer,
        childCount,
        layerIndex,
        height: tallestChild,
        offsetTop,
        canvasWidth,
        canvasId,
        columnSpace,
      });

      highlights.push(...payload.highlights);
      childCount += payload.childCount;
      offsetTop += tallestChild || 0;
      layerIndex += 1;
    }
    // Add a layer of horizontal highlights for the empty space at the bottom of a stack.
    highlights.push(
      ...generateHorizontalHighlights(
        childCount,
        layerIndex,
        offsetTop,
        canvasWidth,
        canvasId,
      ),
    );
    return highlights;
  } catch (e) {
    console.error(e);
    return [];
  }
}
interface VerticalHighlightsPayload {
  childCount: number;
  highlights: HighlightInfo[];
}

function generateVerticalHighlights(data: {
  widgets: CanvasWidgetsReduxState;
  layer: FlexLayer;
  childCount: number;
  layerIndex: number;
  height: number;
  offsetTop: number;
  canvasWidth: number;
  canvasId: string;
  columnSpace: number;
}): VerticalHighlightsPayload {
  const {
    canvasId,
    canvasWidth,
    childCount,
    columnSpace,
    height,
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
    endColumns = 0;

  for (const child of children) {
    const widget = widgets[child.id];
    if (!widget) continue;
    count += 1;

    if (child.align === FlexLayerAlignment.End) {
      endChildren.push(widget);
      endColumns += widget.rightColumn - widget.leftColumn;
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(widget);
    } else {
      startChildren.push(widget);
      startColumns += widget.rightColumn - widget.leftColumn;
    }
  }

  return {
    highlights: [
      ...generateHighlightsForSubWrapper({
        arr: startChildren,
        childCount,
        layerIndex,
        alignment: FlexLayerAlignment.Start,
        height,
        offsetTop,
        canvasId,
        parentColumnSpace: columnSpace,
        parentRowSpace: widgets[canvasId].parentRowSpace,
        canvasWidth,
      }),
      ...generateHighlightsForSubWrapper({
        arr: centerChildren,
        childCount: childCount + startChildren.length,
        layerIndex,
        alignment: FlexLayerAlignment.Center,
        height,
        offsetTop,
        canvasId,
        parentColumnSpace: columnSpace,
        parentRowSpace: widgets[canvasId].parentRowSpace,
        canvasWidth,
        avoidInitialHighlight: startColumns > 25 || endColumns > 25,
      }),
      ...generateHighlightsForSubWrapper({
        arr: endChildren,
        childCount: childCount + startChildren.length + centerChildren.length,
        layerIndex,
        alignment: FlexLayerAlignment.End,
        height,
        offsetTop,
        canvasId,
        parentColumnSpace: columnSpace,
        parentRowSpace: widgets[canvasId].parentRowSpace,
        canvasWidth,
      }),
    ],
    childCount: count,
  };
}

function generateHighlightsForSubWrapper(data: {
  arr: any[];
  childCount: number;
  layerIndex: number;
  alignment: FlexLayerAlignment;
  height: number;
  offsetTop: number;
  canvasId: string;
  parentColumnSpace: number;
  parentRowSpace: number;
  canvasWidth: number;
  avoidInitialHighlight?: boolean;
}): HighlightInfo[] {
  const {
    alignment,
    arr,
    avoidInitialHighlight,
    canvasId,
    canvasWidth,
    childCount,
    height,
    layerIndex,
    offsetTop,
    parentColumnSpace,
  } = data;
  const res: HighlightInfo[] = [];
  let count = 0;
  for (const child of arr) {
    const { leftColumn } = child;
    res.push({
      isNewLayer: false,
      index: count + childCount,
      layerIndex,
      rowIndex: count,
      alignment,
      posX: leftColumn * parentColumnSpace,
      posY: offsetTop,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height,
      isVertical: true,
      canvasId,
    });
    count += 1;
  }

  if (!avoidInitialHighlight)
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
          ? arr[arr.length - 1].rightColumn * parentColumnSpace
          : 0,
        canvasWidth,
        parentColumnSpace,
      ),
      posY: offsetTop,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height,
      isVertical: true,
      canvasId,
    });
  return res;
}

function getPositionForInitialHighlight(
  highlights: HighlightInfo[],
  alignment: FlexLayerAlignment,
  posX: number,
  containerWidth: number,
  parentColumnSpace: number,
): number {
  if (alignment === FlexLayerAlignment.End) {
    return 64 * parentColumnSpace;
  } else if (alignment === FlexLayerAlignment.Center) {
    if (!highlights.length) return containerWidth / 2;
    return posX;
  } else {
    if (!highlights.length) return 2;
    return posX;
  }
}

function generateHorizontalHighlights(
  childIndex: number,
  layerIndex: number,
  offsetTop: number,
  containerWidth: number,
  canvasId: string,
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
      posX: width * index,
      posY: offsetTop,
      width,
      height: DEFAULT_HIGHLIGHT_SIZE,
      isVertical: false,
      canvasId,
    });
  });
  return arr;
}
