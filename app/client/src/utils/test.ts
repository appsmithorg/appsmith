import { FlexLayerAlignment, LayoutDirection } from "components/constants";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex?: number; // index of layer in props.flexLayers.
  align?: FlexLayerAlignment; // alignment of the child in the layer.
  posX?: number; // x position of the highlight.
  posY?: number; // y position of the highlight.
  width?: number; // width of the highlight.
  height?: number; // height of the highlight.
}

// TODO: Add logic for infering highlight position and size.
// e.g. initial offset for center wrapper => posX = parent.width / 2

function generateHighlights(
  direction: LayoutDirection,
  flexLayers: FlexLayer[],
  children: string[],
) {
  if (direction === LayoutDirection.Vertical) {
    return [
      ...getContainerHighlights(flexLayers),
      ...generateHighlightsForLayers(flexLayers),
    ];
  }
  return generateHighlightsForChildren(children);
}

/**
 * Derive highlights for the container.
 */

function getContainerHighlights(flexLayers: FlexLayer[]) {
  let childCount = 0;
  const arr = flexLayers.map((layer, index) => {
    const res = {
      isNewLayer: true,
      index: childCount,
      layerIndex: index,
    };
    childCount += layer.children.length;
    return res;
  });
  // Add a final highlight at the end.
  arr.push({
    isNewLayer: true,
    index: childCount,
    layerIndex: arr.length,
  });
  return arr;
}

/**
 * Derive highlights for each layer.
 */

function generateHighlightsForLayers(layers: FlexLayer[]) {
  // eslint-disable-next-line prefer-const
  let childCount = 0;
  const arr: HighlightInfo[] = [];
  layers.forEach((layer, index) => {
    const { center, end, hasFillChild, start } = spreadLayer(layer);
    // process start sub wrapper.
    arr.push(
      ...getLayerHighlights(start, childCount, index, FlexLayerAlignment.Start),
    );
    if (!hasFillChild) {
      // process center sub wrapper.
      arr.push(
        ...getLayerHighlights(
          center,
          childCount,
          index,
          FlexLayerAlignment.Center,
        ),
      );
      // process end sub wrapper.
      arr.push(
        ...getLayerHighlights(
          end,
          childCount,
          index,
          FlexLayerAlignment.Center,
        ),
      );
    }
  });
  return arr;
}

function spreadLayer(layer: FlexLayer) {
  const start: LayerChild[] = [],
    center: LayerChild[] = [],
    end: LayerChild[] = [];
  layer.children.forEach((child: LayerChild) => {
    if (layer.hasFillChild) {
      start.push(child);
      return;
    }
    if (child.align === FlexLayerAlignment.End) end.push(child);
    else if (child.align === FlexLayerAlignment.Center) center.push(child);
    else start.push(child);
  });
  return { start, center, end, hasFillChild: layer.hasFillChild };
}

function getLayerHighlights(
  layer: LayerChild[],
  childCount: number,
  layerIndex: number,
  align: FlexLayerAlignment,
): HighlightInfo[] {
  const arr: HighlightInfo[] = [];
  if (!layer.length) {
    arr.push(getInitialOffset(childCount, align, layerIndex));
    return arr;
  }
  arr.push(...getOffsets(layer, childCount, align, layerIndex));
  return arr;
}

function getInitialOffset(
  childCount: number,
  align: FlexLayerAlignment,
  layerIndex: number,
): HighlightInfo {
  return {
    isNewLayer: false,
    index: childCount,
    layerIndex,
    align,
  };
}

function getOffsets(
  layer: LayerChild[],
  childCount: number,
  align: FlexLayerAlignment,
  layerIndex: number,
) {
  const arr: HighlightInfo[] = [];
  layer.forEach((child, index) => {
    // A highlight before each existing child.
    arr.push({
      isNewLayer: false,
      index: childCount,
      layerIndex,
      align,
    });
    childCount += 1;
  });
  // A highlight after the last child.
  arr.push({
    isNewLayer: false,
    index: childCount,
    layerIndex,
    align,
  });
  return arr;
}

/**
 * Derive highlights for children
 */
function generateHighlightsForChildren(children: string[]): HighlightInfo[] {
  const arr: HighlightInfo[] = [];
  children.forEach((child, index) => {
    arr.push({
      isNewLayer: true,
      index,
    });
  });
  arr.push({ isNewLayer: true, index: children.length });
  return arr;
}
