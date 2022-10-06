import { getWidgets } from "sagas/selectors";
import { useSelector } from "store";

import { LayoutDirection, FlexLayerAlignment } from "components/constants";
import { isNaN } from "lodash";
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
  align: FlexLayerAlignment; // alignment of the child in the layer.
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

export interface DropPositionPayload {
  index: number;
  alignment: FlexLayerAlignment;
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
  let dragBlocksSize = 0;
  const siblingElements: any[] = [];
  let lastTranslatedIndex: number;
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

  const getContainerDimensions = () => {
    if (!containerDimensions) updateContainerDimensions();
    return containerDimensions;
  };

  const initialOffsets: Record<
    FlexLayerAlignment,
    Record<LayoutDirection, Highlight>
  > = {
    [FlexLayerAlignment.Start]: {
      [LayoutDirection.Vertical]: {
        x: 0,
        y: 8,
        width: getContainerDimensions()?.width || BASE_OFFSET_SIZE,
        height: OFFSET_WIDTH,
        alignment: FlexLayerAlignment.Start,
      },
      [LayoutDirection.Horizontal]: {
        x: 8,
        y: 0,
        width: OFFSET_WIDTH,
        height: getContainerDimensions()?.height || BASE_OFFSET_SIZE,
        alignment: FlexLayerAlignment.Start,
      },
    },
    [FlexLayerAlignment.Center]: {
      [LayoutDirection.Vertical]: {
        x: 0,
        y: getContainerDimensions()?.height / 2,
        width: getContainerDimensions()?.width || BASE_OFFSET_SIZE,
        height: OFFSET_WIDTH,
        alignment: FlexLayerAlignment.Center,
      },
      [LayoutDirection.Horizontal]: {
        x: getContainerDimensions()?.width / 2,
        y: 0,
        width: OFFSET_WIDTH,
        height: getContainerDimensions()?.height || BASE_OFFSET_SIZE,
        alignment: FlexLayerAlignment.Center,
      },
    },
    [FlexLayerAlignment.End]: {
      [LayoutDirection.Vertical]: {
        x: 0,
        y: getContainerDimensions()?.bottom,
        width: getContainerDimensions()?.width || BASE_OFFSET_SIZE,
        height: OFFSET_WIDTH,
        alignment: FlexLayerAlignment.End,
      },
      [LayoutDirection.Horizontal]: {
        x: getContainerDimensions()?.right,
        y: 0,
        width: OFFSET_WIDTH,
        height: getContainerDimensions()?.height || BASE_OFFSET_SIZE,
        alignment: FlexLayerAlignment.End,
      },
    },
  };

  // Create and add an initial offset for an empty canvas
  // const getInitialOffset = (
  //   alignment: FlexLayerAlignment = FlexLayerAlignment.Start,
  // ): Highlight => {
  //   const dir: LayoutDirection = direction || LayoutDirection.Horizontal;
  //   if (false) return initialOffsets[alignment][dir];
  //   return initialOffsets[FlexLayerAlignment.Start][dir];
  // };
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
    dragBlocksSize = 0;
    lastTranslatedIndex = -10;
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

  // Get the total 1D size of the drag block.
  const calculateDragBlockSize = (): void => {
    blocksToDraw?.forEach((each) => {
      dragBlocksSize += isVertical ? each.height : each.width;
    });
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
      calculateDragBlockSize();
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
    console.log("#### highlights: ", highlights);
    return highlights;
  };

  function generateHighlightsForChildren(children: string[]): HighlightInfo[] {
    const arr: HighlightInfo[] = [];
    const rects: DOMRect[] = [];
    children.forEach((child, index) => {
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
        align: FlexLayerAlignment.Start,
      });
    });
    // TODO: Add check for empty container.
    const lastElRect: DOMRect = rects[rects.length - 1];
    arr.push({
      isNewLayer: true,
      index: children.length,
      posX: lastElRect.x - containerDimensions?.left + lastElRect.width,
      posY: lastElRect.y - containerDimensions?.top,
      width: OFFSET_WIDTH,
      height: lastElRect.height,
      align: FlexLayerAlignment.Start,
    });
    return arr;
  }

  function filterLayers(
    flexLayers: FlexLayer[],
    draggedBlocks: string[],
  ): FlexLayer[] {
    return flexLayers.filter((layer) => {
      return layer.children?.some((each) => {
        return draggedBlocks.indexOf(each.id) === -1;
      });
    });
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
    let childCount = 0;
    let discardedLayers = 0;
    let index = 0;
    const arr: HighlightInfo[] = [];
    const rects: DOMRect[] = [];
    console.log("#### flexLayers: ", flexLayers);
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
        align: FlexLayerAlignment.Start,
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
      console.log("#### arr: ", arr);
      index += 1;
      childCount += layer.children?.length || 0;
    }
    console.log("#### rects: ", rects);
    const lastElRect: DOMRect = rects[rects.length - 1];
    arr.push({
      isNewLayer: true,
      index: childCount,
      layerIndex: rects.length,
      posX: 0,
      posY: lastElRect.y + lastElRect.height - containerDimensions?.top,
      width: containerDimensions?.width,
      height: OFFSET_WIDTH,
      align: FlexLayerAlignment.Start,
    });
    console.log("#### final arr: ", arr);
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
      arr.push(getInitialHighlight(childCount, align, layerIndex, layerRect));
      return arr;
    }
    arr.push(...getHighlights(layer, childCount, align, layerIndex, layerRect));
    return arr;
  }

  function getInitialHighlight(
    childCount: number,
    align: FlexLayerAlignment,
    layerIndex: number,
    rect: DOMRect,
  ): HighlightInfo {
    return {
      isNewLayer: false,
      index: childCount,
      layerIndex,
      align,
      posX:
        align === FlexLayerAlignment.Start
          ? 0
          : align === FlexLayerAlignment.Center
          ? containerDimensions.width / 2
          : containerDimensions?.width,
      posY: rect.y - containerDimensions?.top,
      width: OFFSET_WIDTH,
      height: rect.height,
    };
  }

  function getHighlights(
    layer: LayerChild[],
    childCount: number,
    align: FlexLayerAlignment,
    layerIndex: number,
    rect: DOMRect,
  ) {
    const arr: HighlightInfo[] = [];
    const childRects: DOMRect[] = [];
    layer.forEach((child) => {
      const el = getDomElement(child.id);
      if (!el) return null;
      const childRect: DOMRect = el?.getBoundingClientRect();
      childRects.push(childRect);
      // A highlight before each existing child.
      arr.push({
        isNewLayer: false,
        index: childCount,
        layerIndex,
        align,
        posX: childRect.left - containerDimensions?.left,
        posY: childRect.y - containerDimensions?.top,
        width: OFFSET_WIDTH,
        height: childRect.height,
      });
      childCount += 1;
    });
    // A highlight after the last child.
    const lastRect: DOMRect = childRects[childRects.length - 1];
    arr.push({
      isNewLayer: false,
      index: childCount,
      layerIndex,
      align,
      posX: lastRect.right - containerDimensions?.left,
      posY: lastRect.y - containerDimensions?.top,
      width: OFFSET_WIDTH,
      height: lastRect.height,
    });
    return arr;
  }

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  const translateSiblings = (position: HighlightInfo): void => {
    let dropIndex = 0;
    if (position)
      dropIndex = highlights
        ?.map((each) => `${each.posX},${each.posY}`)
        .indexOf(`${position.posX},${position.posY}`);
    if (dropIndex === lastTranslatedIndex) return;

    lastTranslatedIndex = dropIndex;
    // console.log(`#### lastTranslatedIndex: ${lastTranslatedIndex}`);
    return;
    // Get all siblings after the highlighted drop position
    const arr = [...siblingElements];

    // translate each element in the appropriate direction
    const x = !isVertical ? dragBlocksSize : 0;
    const y = isVertical ? dragBlocksSize : 0;
    arr.forEach((each, index) => {
      if (index < dropIndex) {
        each.style.transform = null;
      } else {
        each.style.transform = `translate(${x}px, ${y}px)`;
        each.style.transitionDuration = "0.2s";
      }
    });
  };

  const highlightDropPosition = (e: any) => {
    if (!useAutoLayout) return;
    const pos: HighlightInfo | undefined = getHighlightPosition(e);

    if (!pos) return;
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
    translateSiblings(pos);
  };

  const getHighlightPosition = (e: any, val?: XYCord): HighlightInfo => {
    let base: HighlightInfo[] = [];
    if (!highlights || !highlights.length)
      highlights = [
        getInitialHighlight(0, FlexLayerAlignment.Start, 0, {
          x: containerDimensions.left,
          y: containerDimensions.top,
          width: containerDimensions.width,
          height: containerDimensions.height,
        } as DOMRect),
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

  const getDropPosition = (index: number): number => {
    if (isNaN(index)) return 0;
    const alignment: FlexLayerAlignment =
      highlights[index]?.align || FlexLayerAlignment.Start;
    if (alignment === FlexLayerAlignment.Center) return index - 1;
    if (alignment === FlexLayerAlignment.End) return index - 2;
    return index;
  };

  const getDropInfo = (val: XYCord): DropPositionPayload | undefined => {
    if (!isNaN(lastTranslatedIndex) && lastTranslatedIndex >= 0)
      return {
        index: getDropPosition(lastTranslatedIndex),
        alignment: highlights[lastTranslatedIndex]?.align,
      };
    const pos = getHighlightPosition(null, val);
    if (!pos) return;
    const dropPos: number = highlights.indexOf(pos);
    return {
      index: getDropPosition(dropPos),
      alignment: highlights[dropPos]?.align,
    };
  };

  return {
    calculateHighlights,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  };
};
