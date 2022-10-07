import { getWidgets } from "sagas/selectors";
import { useSelector } from "store";

import { LayoutDirection, FlexLayerAlignment } from "components/constants";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";

interface XYCord {
  x: number;
  y: number;
}

export interface Highlight {
  x: number;
  y: number;
  height: number;
  width: number;
  alignment: FlexLayerAlignment;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex?: number; // index of layer in props.flexLayers.
  alignment: FlexLayerAlignment; // alignment of the child in the layer.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  width: number; // width of the highlight.
  height: number; // height of the highlight.
}

export interface AutoLayoutHighlightProps {
  blocksToDraw: WidgetDraggingBlock[];
  canvasId: string;
  direction?: LayoutDirection;
  dropPositionRef: React.RefObject<HTMLDivElement>;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  useAutoLayout?: boolean;
  widgetName?: string;
}

const BASE_OFFSET_SIZE = 100;
const OFFSET_WIDTH = 4;

export const useAutoLayoutHighlights = ({
  blocksToDraw,
  canvasId,
  direction,
  dropPositionRef,
  isCurrentDraggedCanvas,
  isDragging,
  useAutoLayout,
}: AutoLayoutHighlightProps) => {
  const allWidgets = useSelector(getWidgets);
  const canvas = allWidgets[canvasId];
  const layers: FlexLayer[] = canvas?.flexLayers || [];
  const isVertical = direction === LayoutDirection.Vertical;

  let highlights: HighlightInfo[] = [];
  let lastActiveHighlight: HighlightInfo | undefined;
  let containerDimensions: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };

  /**
   * START AUTO LAYOUT OFFSET CALCULATION
   */

  // Fetch and update the dimensions of the containing canvas.
  const updateContainerDimensions = (): boolean => {
    const container = document.querySelector(`.appsmith_widget_${canvasId}`);
    const containerRect:
      | DOMRect
      | undefined = container?.getBoundingClientRect();
    if (!container || !containerRect) return false;
    containerDimensions = {
      top: containerRect?.top || 0,
      bottom: containerRect?.bottom - containerDimensions?.top || 0,
      left: containerRect?.left || 0,
      right: containerRect?.right - containerRect?.left || 0,
      width: containerRect?.width,
      height: containerRect?.height,
    };
    // console.log(
    //   `#### container dimensions: ${JSON.stringify(containerDimensions)}`,
    // );
    return true;
  };

  const getContainerDimensionsAsDomRect = (): DOMRect => {
    if (!containerDimensions) updateContainerDimensions();
    return {
      x: containerDimensions?.left,
      y: containerDimensions?.top,
      width: containerDimensions?.width,
      height: containerDimensions?.height,
    } as DOMRect;
  };

  // Get DOM element for a given widgetId
  const getDomElement = (widgetId: string): any =>
    document.querySelector(`.auto-layout-child-${widgetId}`);

  const cleanUpTempStyles = () => {
    // reset display of all dragged blocks
    const els = document.querySelectorAll(`.auto-layout-parent-${canvasId}`);
    if (els && els.length) {
      els.forEach((el) => {
        (el as any).classList.remove("auto-temp-no-display");
        (el as any).style.transform = null;
      });
    }

    // reset state
    lastActiveHighlight = undefined;
    highlights = [];
    // Hide the highlight
    if (dropPositionRef && dropPositionRef.current) {
      dropPositionRef.current.style.opacity = "0";
      dropPositionRef.current.style.display = "none";
    }
  };

  // Get a list of widgetIds that are being dragged.
  const getDraggedBlocks = (): string[] => {
    const blocks = blocksToDraw.map((block) => block.widgetId);
    // console.log(`#### blocksToDraw: ${JSON.stringify(blocksToDraw)}`);
    // console.log(`#### blocks: ${JSON.stringify(blocks)}`);
    return blocks;
  };

  // Hide the dragged children of the auto layout container
  // to discount them from highlight calculation.
  const hideDraggedItems = (draggedBlocks: string[]): void => {
    draggedBlocks.forEach((id: string) => {
      const el = getDomElement(id);
      if (el) {
        el.classList.add("auto-temp-no-display");
      }
    });
  };

  const calculateHighlights = (): HighlightInfo[] => {
    /**
     * 1. Clean up temp styles.
     * 2. Get the dragged blocks.
     * 3. Discount dragged blocks and empty layers from the calculation.
     * 4. hide the dragged blocks and empty layers.
     */
    cleanUpTempStyles(); // TODO: is this needed?
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      const draggedBlocks = getDraggedBlocks();
      if (!draggedBlocks || !draggedBlocks.length) return [];
      /**
       * update dimensions of the current canvas
       * and break out of the function if returned value is false.
       * That implies the container is null.
       */
      if (!updateContainerDimensions()) return [];
      hideDraggedItems(draggedBlocks);

      if (isVertical) {
        highlights = generateContainerHighlights(layers, draggedBlocks);
      } else {
        const canvasChildren = canvas.children || [];
        const offsetChildren = canvasChildren.filter((each) => {
          return draggedBlocks.indexOf(each) === -1;
        });
        highlights = generateHighlightsForChildren(offsetChildren);
      }
    }
    // console.log("#### highlights: ", highlights);
    return highlights;
  };

  function generateHighlightsForChildren(children: string[]): HighlightInfo[] {
    if (!children || !children.length)
      return [
        getInitialHighlight(
          0,
          FlexLayerAlignment.Start,
          0,
          getContainerDimensionsAsDomRect(),
          LayoutDirection.Horizontal,
          true,
        ),
      ];
    const arr: HighlightInfo[] = [];
    const rects: DOMRect[] = [];
    let index = 0;
    for (const child of children) {
      const el = getDomElement(child);
      const childRect: DOMRect = el.getBoundingClientRect();
      rects.push(childRect);
      arr.push({
        isNewLayer: true,
        index,
        posX: childRect.x - containerDimensions?.left,
        posY: childRect.y - containerDimensions?.top,
        width: OFFSET_WIDTH,
        height: childRect.height,
        alignment: FlexLayerAlignment.Start,
      });
      index += 1;
    }
    // TODO: Add check for empty container.
    const lastElRect: DOMRect = rects[rects.length - 1];
    arr.push({
      isNewLayer: true,
      index: children.length,
      posX: lastElRect?.x - containerDimensions?.left + lastElRect?.width,
      posY: lastElRect?.y - containerDimensions?.top,
      width: OFFSET_WIDTH,
      height: lastElRect?.height,
      alignment: FlexLayerAlignment.Start,
    });
    return arr;
  }

  function isEmptyLayer(layer: FlexLayer, draggedBlocks: string[]): boolean {
    return (
      layer.children?.length === 0 ||
      !layer.children?.some((each) => {
        return draggedBlocks.indexOf(each.id) === -1;
      })
    );
  }

  function generateContainerHighlights(
    flexLayers: FlexLayer[],
    draggedBlocks: string[],
  ): HighlightInfo[] {
    if (!flexLayers || !flexLayers.length)
      return [
        getInitialHighlight(
          0,
          FlexLayerAlignment.Start,
          0,
          getContainerDimensionsAsDomRect(),
          LayoutDirection.Vertical,
          true,
        ),
      ];
    let childCount = 0;
    let discardedLayers = 0;
    let index = 0;
    const arr: HighlightInfo[] = [];
    const rects: DOMRect[] = [];
    for (const layer of flexLayers) {
      if (isEmptyLayer(layer, draggedBlocks)) {
        discardedLayers += 1;
        continue;
      }
      const el = document.querySelector(
        `.auto-layout-layer-${canvasId}-${index}`,
      );
      if (!el) {
        discardedLayers += 1;
        continue;
      }
      const rect: DOMRect = el.getBoundingClientRect();
      rects.push(rect);
      const info: HighlightInfo = {
        isNewLayer: true,
        index: childCount,
        layerIndex: index - discardedLayers,
        posX: 0,
        posY: rect.y - containerDimensions?.top,
        width: containerDimensions?.width,
        height: OFFSET_WIDTH,
        alignment: FlexLayerAlignment.Start,
      };
      arr.push(info);
      arr.push(
        ...generateHighlightsForLayer(
          layer,
          index - discardedLayers,
          rect,
          childCount,
        ),
      );
      index += 1;
      childCount += layer.children?.length || 0;
    }

    const lastElRect: DOMRect = rects[rects.length - 1];
    arr.push({
      isNewLayer: true,
      index: childCount,
      layerIndex: rects.length,
      posX: 0,
      posY: lastElRect?.y + lastElRect?.height - containerDimensions?.top,
      width: containerDimensions?.width,
      height: OFFSET_WIDTH,
      alignment: FlexLayerAlignment.Start,
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

  function generateHighlightsForLayer(
    layer: FlexLayer,
    layerIndex: number,
    layerRect: DOMRect,
    childCount: number,
  ): HighlightInfo[] {
    const arr: HighlightInfo[] = [];
    let curr: number = childCount;
    const { center, end, hasFillChild, start } = spreadLayer(layer);
    // process start sub wrapper.
    arr.push(
      ...getLayerHighlights(
        start,
        curr,
        layerIndex,
        FlexLayerAlignment.Start,
        layerRect,
      ),
    );
    if (!hasFillChild) {
      // process center sub wrapper.
      curr += start.length;
      arr.push(
        ...getLayerHighlights(
          center,
          curr,
          layerIndex,
          FlexLayerAlignment.Center,
          layerRect,
        ),
      );
      // process end sub wrapper.
      curr += center.length;
      arr.push(
        ...getLayerHighlights(
          end,
          curr,
          layerIndex,
          FlexLayerAlignment.End,
          layerRect,
        ),
      );
    }
    return arr;
  }

  function getLayerHighlights(
    layer: LayerChild[],
    childCount: number,
    layerIndex: number,
    align: FlexLayerAlignment,
    layerRect: DOMRect,
  ): HighlightInfo[] {
    const arr: HighlightInfo[] = [];
    if (!layer.length) {
      arr.push(
        getInitialHighlight(
          childCount,
          align,
          layerIndex,
          layerRect,
          LayoutDirection.Horizontal,
          false,
        ),
      );
      return arr;
    }
    arr.push(...getHighlights(layer, childCount, align, layerIndex));
    return arr;
  }

  function getInitialHighlight(
    childCount: number,
    alignment: FlexLayerAlignment,
    layerIndex: number,
    rect: DOMRect,
    direction: LayoutDirection,
    isNewLayer = false,
  ): HighlightInfo {
    const verticalFlex = direction === LayoutDirection.Vertical;
    return {
      isNewLayer,
      index: childCount,
      layerIndex,
      alignment,
      posX:
        alignment === FlexLayerAlignment.Start
          ? 0
          : alignment === FlexLayerAlignment.Center
          ? containerDimensions.width / 2
          : containerDimensions?.width,
      posY: rect.y - containerDimensions?.top,
      width: verticalFlex ? rect?.width : OFFSET_WIDTH,
      height: verticalFlex ? OFFSET_WIDTH : rect.height,
    };
  }

  function getHighlights(
    layer: LayerChild[],
    childCount: number,
    alignment: FlexLayerAlignment,
    layerIndex: number,
  ): HighlightInfo[] {
    const arr: HighlightInfo[] = [];
    const childRects: DOMRect[] = [];
    for (const child of layer) {
      const el = getDomElement(child.id);
      if (!el) continue;
      const childRect: DOMRect = el?.getBoundingClientRect();
      childRects.push(childRect);
      // A highlight before each existing child.
      arr.push({
        isNewLayer: false,
        index: childCount,
        layerIndex,
        alignment,
        posX: childRect?.left - containerDimensions?.left,
        posY: childRect?.y - containerDimensions?.top,
        width: OFFSET_WIDTH,
        height: childRect?.height,
      });
      childCount += 1;
    }
    // A highlight after the last child.
    const lastRect: DOMRect = childRects[childRects.length - 1];
    arr.push({
      isNewLayer: false,
      index: childCount,
      layerIndex,
      alignment,
      posX: lastRect?.left + lastRect?.width - containerDimensions?.left,
      posY: lastRect?.y - containerDimensions?.top,
      width: OFFSET_WIDTH,
      height: lastRect?.height,
    });
    return arr;
  }

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  const highlightDropPosition = (e: any) => {
    if (!useAutoLayout) return;
    const pos: HighlightInfo | undefined = getHighlightPosition(e);

    if (!pos) return;
    lastActiveHighlight = pos;
    if (dropPositionRef && dropPositionRef.current) {
      dropPositionRef.current.style.opacity = "1";
      dropPositionRef.current.style.top = (pos.posY || 0) + "px";
      dropPositionRef.current.style.left =
        (pos.posX > 6
          ? Math.min(
              pos.posX - 6,
              containerDimensions.left + containerDimensions.width - 6,
            )
          : 0) + "px";
      dropPositionRef.current.style.width = pos.width + "px";
      dropPositionRef.current.style.height = pos.height + "px";
      dropPositionRef.current.style.display = "block";
    }
  };

  const getHighlightPosition = (e: any, val?: XYCord): HighlightInfo => {
    let base: HighlightInfo[] = [];
    if (!highlights || !highlights.length)
      highlights = [
        getInitialHighlight(
          0,
          FlexLayerAlignment.Start,
          0,
          getContainerDimensionsAsDomRect(),
          direction || LayoutDirection.Vertical,
          true,
        ),
      ];
    base = highlights;

    const pos: XYCord = {
      x: e?.offsetX || val?.x,
      y: e?.offsetY || val?.y,
    };

    const arr = [...base].sort((a, b) => {
      return calculateDistance(a, pos) - calculateDistance(b, pos);
    });
    return arr[0];
  };

  const calculateDistance = (a: HighlightInfo, b: XYCord): number => {
    const x: number = a.posX + a.width / 2 - b.x;
    const y: number = a.posY + a.height / 2 - b.y;
    return Math.abs(Math.sqrt(x * x + y * y));
  };

  const getDropInfo = (val: XYCord): HighlightInfo | undefined => {
    if (lastActiveHighlight) return lastActiveHighlight;

    const pos = getHighlightPosition(null, val);
    if (!pos) return;
    lastActiveHighlight = pos;
    return pos;
  };

  return {
    calculateHighlights,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  };
};
