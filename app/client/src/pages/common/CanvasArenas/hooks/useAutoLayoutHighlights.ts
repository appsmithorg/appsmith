import { FlexLayerAlignment, LayoutDirection } from "components/constants";
import { DEFAULT_HIGHLIGHT_SIZE } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { ReflowDirection } from "reflow/reflowTypes";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

interface XYCord {
  x: number;
  y: number;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex?: number; // index of layer in props.flexLayers.
  rowIndex?: number; // index of highlight within a horizontal layer.
  alignment: FlexLayerAlignment; // alignment of the child in the layer.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  width: number; // width of the highlight.
  height: number; // height of the highlight.
  isVertical: boolean; // determines if the highlight is vertical or horizontal.
  el: Element; // dom node of the highlight.
}

export interface AutoLayoutHighlightProps {
  blocksToDraw: WidgetDraggingBlock[];
  canvasId: string;
  direction?: LayoutDirection;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  useAutoLayout?: boolean;
}

export interface HighlightSelectionPayload {
  highlights: HighlightInfo[];
  selectedHighlight: HighlightInfo;
  showNewLayerAlignments?: boolean;
}

export const useAutoLayoutHighlights = ({
  blocksToDraw,
  canvasId,
  direction,
  isCurrentDraggedCanvas,
  isDragging,
  useAutoLayout,
}: AutoLayoutHighlightProps) => {
  let highlights: HighlightInfo[] = [];
  let newLayers: { [key: string]: number };
  let lastActiveHighlight: HighlightInfo | undefined;
  let expandedNewLayer: number | undefined;

  const isVerticalStack = direction === LayoutDirection.Vertical;
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
    return true;
  };

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
    expandedNewLayer = undefined;
    highlights = [];
    newLayers = {};
  };

  const getDropPositions = () => {
    const els = document.querySelectorAll(`.t--drop-position-${canvasId}`);
    const highlights: HighlightInfo[] = [];
    for (const el of els) {
      const rect: DOMRect = el.getBoundingClientRect();
      const classList = Array.from(el.classList);

      const highlight: HighlightInfo = classList.reduce(
        (acc: HighlightInfo, curr) => {
          if (curr.indexOf("alignment") > -1)
            acc.alignment = curr.split("-")[1] as FlexLayerAlignment;
          else if (curr.indexOf("layer-index") > -1)
            acc.layerIndex = parseInt(curr.split("layer-index-")[1]);
          else if (curr.indexOf("child-index") > -1)
            acc.index = parseInt(curr.split("child-index-")[1]);
          else if (curr.indexOf("isNewLayer") > -1) acc.isNewLayer = true;
          else if (curr.indexOf("isVertical") > -1) acc.isVertical = true;

          return acc;
        },
        {
          isNewLayer: false,
          index: 0,
          layerIndex: 0,
          alignment: FlexLayerAlignment.Start,
          posX: rect.x - containerDimensions.left,
          posY: rect.y - containerDimensions?.top,
          width: rect.width,
          height: rect.height,
          isVertical: false,
          el,
        },
      );
      if (!highlight.isVertical) newLayers[highlights.length] = highlight.posY;
      highlights.push(highlight);
    }

    return highlights;
  };

  const updateHighlight = (index: number): HighlightInfo => {
    const highlight = highlights[index];
    if (!highlight || !highlight.el) return highlight;
    const rect: DOMRect = highlight.el.getBoundingClientRect();

    highlight.posX = rect.x - containerDimensions.left;
    highlight.posY = rect.y - containerDimensions.top;
    highlight.width = rect.width;
    highlight.height = rect.height;
    highlights[index] = highlight;
    return highlight;
  };

  const calculateHighlights = (): HighlightInfo[] => {
    cleanUpTempStyles();
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      if (!blocksToDraw || !blocksToDraw.length) return [];
      /**
       * update dimensions of the current canvas
       * and break out of the function if returned value is false.
       * That implies the container is null.
       */
      if (!updateContainerDimensions()) return [];

      highlights = getDropPositions();
    }
    // console.log("#### highlights", highlights);
    return highlights;
  };

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  const toggleNewLayerAlignments = (
    el: Element | undefined,
    reveal: boolean,
  ): void => {
    if (!el) return;
    const horizontalElement = el as HTMLElement;
    const verticalElement = el?.nextSibling as HTMLElement;
    if (verticalElement) {
      if (reveal) {
        horizontalElement.style.display = "none";
        verticalElement.style.display = "flex";
        verticalElement.style.height = "40px";
        verticalElement.style.border = "1px dotted rgba(223, 158, 206, 0.6)";
      } else {
        (horizontalElement as HTMLElement).style.display = "block";
        verticalElement.style.display = "none";
      }
    }
  };

  const toggleHighlightVisibility = (
    arr: HighlightInfo[],
    selected: HighlightInfo[],
  ): void => {
    arr.forEach((each: HighlightInfo) => {
      const el = each.el as HTMLElement;
      if (!isVerticalStack) el.style.opacity = "1";
      else el.style.opacity = selected.includes(each) ? "1" : "0";
    });
  };

  const updateSelection = (highlight: HighlightInfo): void => {
    if (lastActiveHighlight) {
      const lastEl = lastActiveHighlight?.el as HTMLElement;
      if (lastEl) {
        lastActiveHighlight.isVertical
          ? (lastEl.style.width = `${DEFAULT_HIGHLIGHT_SIZE}px`)
          : (lastEl.style.height = `${DEFAULT_HIGHLIGHT_SIZE}px`);
        lastEl.style.backgroundColor = "rgba(223, 158, 206, 0.6)";
      }
    }
    const el = highlight.el as HTMLElement;
    if (el) {
      highlight.isVertical
        ? (el.style.width = `${DEFAULT_HIGHLIGHT_SIZE * 1.5}px`)
        : (el.style.height = `${DEFAULT_HIGHLIGHT_SIZE * 1.5}px`);
      el.style.backgroundColor = "rgba(196, 139, 181, 1)";
    }
    lastActiveHighlight = highlight;
  };

  const highlightDropPosition = (
    e: any,
    moveDirection: ReflowDirection,
    // acceleration: number,
  ): HighlightSelectionPayload | undefined => {
    if (!highlights) return;
    const payload: HighlightSelectionPayload = getHighlightPayload(
      e,
      moveDirection,
    );

    if (!payload || !payload.selectedHighlight) return;

    updateSelection(payload.selectedHighlight);

    return payload;
  };

  const getHighlightPayload = (
    e: any,
    moveDirection?: ReflowDirection,
    val?: XYCord,
  ): HighlightSelectionPayload => {
    let base: HighlightInfo[] = [];
    if (!highlights || !highlights.length) highlights = getDropPositions();
    base = highlights;

    const pos: XYCord = {
      x: e?.offsetX || val?.x,
      y: e?.offsetY || val?.y,
    };

    let filteredHighlights: HighlightInfo[] = [];
    const newLayerIndex = isInNewLayerRange(pos.y);

    if (newLayerIndex > -1) {
      filteredHighlights = [
        ...base.slice(
          newLayerIndex + 1,
          Math.min(newLayerIndex + 4, base.length),
        ),
      ];
      if (filteredHighlights[0].height === 0) {
        filteredHighlights[0] = updateHighlight(newLayerIndex + 1);
        filteredHighlights[1] = updateHighlight(newLayerIndex + 2);
        filteredHighlights[2] = updateHighlight(newLayerIndex + 3);
      }
      expandedNewLayer !== undefined &&
        toggleNewLayerAlignments(highlights[expandedNewLayer]?.el, false);
      toggleNewLayerAlignments(highlights[newLayerIndex].el, true);
      expandedNewLayer = newLayerIndex;
    } else {
      filteredHighlights = getViableDropPositions(base, pos, moveDirection);
      expandedNewLayer !== undefined &&
        toggleNewLayerAlignments(highlights[expandedNewLayer]?.el, false);
      expandedNewLayer = undefined;
    }
    toggleHighlightVisibility(base, filteredHighlights);
    const arr = filteredHighlights.sort((a, b) => {
      return (
        calculateDistance(a, pos, moveDirection) -
        calculateDistance(b, pos, moveDirection)
      );
    });

    return {
      highlights: [...arr.slice(1)],
      selectedHighlight: arr[0],
    };
  };

  function isInNewLayerRange(y: number): number {
    const positions: number[] = Object.values(newLayers);
    const keys: string[] = Object.keys(newLayers);
    if (!positions || !positions.length) return -1;
    const index: number = positions.findIndex((each: number, index: number) => {
      const lower: number =
        expandedNewLayer !== undefined ? each : Math.max(each - 5, 0);
      const upper: number =
        expandedNewLayer !== undefined &&
        expandedNewLayer === parseInt(keys[index])
          ? each + 35
          : each + 14;
      return y >= lower && (y <= upper || index === positions.length - 1);
    });
    if (index === -1) return -1;
    return parseInt(keys[index]);
  }

  function getViableDropPositions(
    arr: HighlightInfo[],
    pos: XYCord,
    moveDirection?: ReflowDirection,
  ): HighlightInfo[] {
    if (!moveDirection || !arr) return arr || [];
    const isVerticalDrag = [
      ReflowDirection.TOP,
      ReflowDirection.BOTTOM,
    ].includes(moveDirection);
    return direction === LayoutDirection.Vertical
      ? getVerticalStackDropPositions(arr, pos, isVerticalDrag)
      : getHorizontalStackDropPositions(arr, pos);
  }

  function getVerticalStackDropPositions(
    arr: HighlightInfo[],
    pos: XYCord,
    isVerticalDrag: boolean,
  ): HighlightInfo[] {
    // For vertical stacks, filter out the highlights based on drag direction and y position.
    let filteredHighlights: HighlightInfo[] = arr.filter(
      (highlight: HighlightInfo) => {
        // Return only horizontal highlights for vertical drag.
        if (isVerticalDrag) return !highlight.isVertical;
        // Return only vertical highlights for horizontal drag, if they lie in the same x plane.
        return (
          highlight.isVertical &&
          pos.y >= highlight.posY &&
          pos.y <= highlight.posY + highlight.height
        );
      },
    );
    // console.log("#### pos", arr, filteredHighlights, isVerticalDrag);
    // For horizontal drag, if no vertical highlight exists in the same x plane,
    // return the last horizontal highlight.
    if (!isVerticalDrag && !filteredHighlights.length) {
      const horizontalHighlights = arr.filter(
        (highlight: HighlightInfo) => !highlight.isVertical,
      );
      filteredHighlights = [
        horizontalHighlights[horizontalHighlights.length - 1],
      ];
    }
    return filteredHighlights;
  }

  function getHorizontalStackDropPositions(
    arr: HighlightInfo[],
    pos: XYCord,
  ): HighlightInfo[] {
    // For horizontal stack, return the highlights that lie in the same x plane.
    let filteredHighlights = arr.filter(
      (highlight) =>
        pos.y >= highlight.posY && pos.y <= highlight.posY + highlight.height,
    );
    // If no highlight exists in the same x plane, return the last highlight.
    if (!filteredHighlights.length) filteredHighlights = [arr[arr.length - 1]];
    return filteredHighlights;
  }

  const calculateDistance = (
    a: HighlightInfo,
    b: XYCord,
    moveDirection?: ReflowDirection,
  ): number => {
    /**
     * Calculate perpendicular distance of a point from a line.
     * If moving vertically, x is fixed (x = 0) and vice versa.
     */
    const isVerticalDrag =
      moveDirection &&
      [ReflowDirection.TOP, ReflowDirection.BOTTOM].includes(moveDirection);

    let distX: number = a.isVertical && isVerticalDrag ? 0 : a.posX - b.x;
    let distY: number = !a.isVertical && !isVerticalDrag ? 0 : a.posY - b.y;

    if (moveDirection === ReflowDirection.LEFT && distX > 20) distX += 2000;
    if (moveDirection === ReflowDirection.RIGHT && distX < -20) distX -= 2000;
    if (moveDirection === ReflowDirection.TOP && distY > 20) distY += 2000;
    if (moveDirection === ReflowDirection.BOTTOM && distY < -20) distY -= 2000;

    return Math.abs(Math.sqrt(distX * distX + distY * distY));
  };

  const getDropInfo = (val: XYCord): HighlightInfo | undefined => {
    if (lastActiveHighlight) return lastActiveHighlight;

    const payload: HighlightSelectionPayload = getHighlightPayload(
      null,
      undefined,
      val,
    );
    if (!payload) return;
    lastActiveHighlight = payload.selectedHighlight;
    return payload.selectedHighlight;
  };

  return {
    calculateHighlights,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  };
};
