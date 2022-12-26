import { FlexLayerAlignment } from "components/constants";
import {
  DEFAULT_HIGHLIGHT_SIZE,
  FlexLayer,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { HighlightInfo } from "pages/common/CanvasArenas/hooks/useAutoLayoutHighlights";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

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
  draggedWidgets: string[] = [],
): HighlightInfo[] {
  const widgets = { ...allWidgets };
  try {
    const canvas = widgets[canvasId];
    if (!canvas) return [];

    const columns: number = canvas.rightColumn - canvas.leftColumn;
    const columnSpace: number =
      canvas.parentColumnSpace === 1 && canvas.parentId
        ? widgets[canvas.parentId].parentColumnSpace
        : canvas.parentColumnSpace;
    const canvasWidth: number = columns * columnSpace;

    const layers: FlexLayer[] = canvas.flexLayers;
    const highlights: HighlightInfo[] = [];
    let childCount = 0;
    let layerIndex = 0;
    // TODO: remove offsetTop and use child positions after widget positioning on grid is solved.
    let offsetTop = 0; // used to calculate distance of a highlight from parents's top.
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
}): VerticalHighlightsPayload {
  const {
    canvasId,
    canvasWidth,
    childCount,
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
        parentColumnSpace: widgets[canvasId].parentColumnSpace,
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
        parentColumnSpace: widgets[canvasId].parentColumnSpace,
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
        parentColumnSpace: widgets[canvasId].parentColumnSpace,
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
  let lastWidgetWidth = 0;
  for (const child of arr) {
    const { leftColumn, rightColumn, widgetId } = child;
    const el = document.querySelector(`.auto-layout-child-${widgetId}`);
    if (!el) continue;
    // TODO: remove boundingClientRect after widget positioning on grid is solved.
    const { x } = el.getBoundingClientRect();
    res.push({
      isNewLayer: false,
      index: count + childCount,
      layerIndex,
      rowIndex: count,
      alignment,
      posX: x,
      posY: offsetTop,
      width: DEFAULT_HIGHLIGHT_SIZE,
      height,
      isVertical: true,
      canvasId,
    });
    count += 1;
    lastWidgetWidth = (rightColumn - leftColumn) * parentColumnSpace;
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
        lastWidgetWidth,
        canvasWidth,
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
  width: number,
  containerWidth: number,
): number {
  if (alignment === FlexLayerAlignment.End) {
    return containerWidth - 2;
    // return highlights[highlights.length - 1].posX - width;
  } else if (alignment === FlexLayerAlignment.Center) {
    if (!highlights.length) return containerWidth / 2;
    return highlights[highlights.length - 1].posX + width;
  } else {
    if (!highlights.length) return 2;
    return highlights[highlights.length - 1].posX + width;
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
