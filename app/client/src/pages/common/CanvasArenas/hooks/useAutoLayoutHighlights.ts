import {
  FlexLayerAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "components/constants";
import { useSelector } from "react-redux";
import { ReflowDirection } from "reflow/reflowTypes";
import { getWidgets } from "sagas/selectors";
import WidgetFactory from "utils/WidgetFactory";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

interface XYCord {
  x: number;
  y: number;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex?: number; // index of layer in props.flexLayers.
  rowIndex: number; // index of highlight within a horizontal layer.
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
  const allWidgets = useSelector(getWidgets);
  let highlights: HighlightInfo[] = [];
  let newLayers: { [key: string]: number } = {};
  let lastActiveHighlight: HighlightInfo | undefined;
  let isFillWidget = false;

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
    // reset state
    lastActiveHighlight = undefined;
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
          else if (curr.indexOf("row-index") > -1)
            acc.rowIndex = parseInt(curr.split("row-index-")[1]);
          else if (curr.indexOf("isNewLayer") > -1) acc.isNewLayer = true;
          else if (curr.indexOf("isVertical") > -1) acc.isVertical = true;

          return acc;
        },
        {
          isNewLayer: false,
          index: 0,
          layerIndex: 0,
          rowIndex: 0,
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

  const checkForFillWidget = (): boolean => {
    let flag = false;
    if (!blocksToDraw?.length) return flag;
    for (const block of blocksToDraw) {
      const widget = allWidgets[block.widgetId];
      if (widget) {
        if (widget.responsiveBehavior === ResponsiveBehavior.Fill) {
          flag = true;
          break;
        }
        continue;
      }
      const config = WidgetFactory.widgetConfigMap.get(block.type);
      if (config) {
        if (config.responsiveBehavior === ResponsiveBehavior.Fill) {
          flag = true;
          break;
        }
      }
    }
    return flag;
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
      isFillWidget = checkForFillWidget();
      highlights = getDropPositions();
    }
    // console.log("#### highlights", highlights);
    return highlights;
  };

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  const updateHighlight = (index: number): HighlightInfo => {
    const highlight = highlights[index];
    if (!highlight || !highlight.el) return highlight;
    const rect: DOMRect = highlight.el.getBoundingClientRect();

    highlight.posX = rect.x - containerDimensions.left;
    highlight.posY = rect.y - containerDimensions.top;
    highlight.width = isFillWidget
      ? highlight.alignment === FlexLayerAlignment.Start
        ? containerDimensions.width
        : 0
      : blocksToDraw[0].width;
    highlight.height = rect.height;
    (highlight.el as HTMLElement).style.width = `${highlight.width}px`;
    highlights[index] = highlight;

    return highlight;
  };

  const updateHighlights = (moveDirection?: ReflowDirection) => {
    if (!highlights?.length || !moveDirection) return;
    highlights.map((highlight: HighlightInfo, index: number) => {
      let updatedHighlight: HighlightInfo = highlight;
      if (highlight.isNewLayer || !highlight.height)
        updatedHighlight = updateHighlight(index);
      return updatedHighlight;
    });
  };

  const toggleHighlightVisibility = (
    arr: HighlightInfo[],
    selected: HighlightInfo,
  ): void => {
    arr.forEach((each: HighlightInfo) => {
      const el = each.el as HTMLElement;
      // if (!isVerticalStack) el.style.opacity = "1";
      el.style.opacity = selected === each ? "1" : "0";
    });
  };

  const updateSelection = (highlight: HighlightInfo): void => {
    if (lastActiveHighlight) {
      const lastEl = lastActiveHighlight?.el as HTMLElement;
      if (lastEl) lastEl.style.backgroundColor = "rgba(223, 158, 206, 0.6)";
    }
    const el = highlight.el as HTMLElement;
    if (el) el.style.backgroundColor = "rgba(196, 139, 181, 1)";
    lastActiveHighlight = highlight;
  };

  const highlightDropPosition = (
    e: any,
    moveDirection: ReflowDirection,
    // acceleration: number,
  ): HighlightInfo | undefined => {
    if (!highlights) return;
    updateHighlights(moveDirection);

    const highlight: HighlightInfo = getHighlightPayload(e, moveDirection);

    if (!highlight) return;

    updateSelection(highlight);

    return highlight;
  };

  const getHighlightPayload = (
    e: any,
    moveDirection?: ReflowDirection,
    val?: XYCord,
  ): HighlightInfo => {
    let base: HighlightInfo[] = [];
    if (!highlights || !highlights.length) highlights = getDropPositions();
    base = highlights;

    const pos: XYCord = {
      x: e?.offsetX || val?.x,
      y: e?.offsetY || val?.y,
    };

    let filteredHighlights: HighlightInfo[] = [];
    filteredHighlights = getViableDropPositions(base, pos, moveDirection);

    const arr = filteredHighlights.sort((a, b) => {
      return (
        calculateDistance(
          a,
          pos,
          moveDirection,
          a.isNewLayer && isVerticalStack,
        ) -
        calculateDistance(
          b,
          pos,
          moveDirection,
          a.isNewLayer && isVerticalStack,
        )
      );
    });
    toggleHighlightVisibility(base, arr[0]);
    // console.log("#### arr", arr, base, moveDirection);
    return arr[0];
  };

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
        if (isVerticalDrag)
          return (
            !highlight.isVertical &&
            highlight.width > 0 &&
            pos.x > 0 &&
            pos.y > 0 &&
            pos.x >= highlight.posX &&
            pos.x <= highlight.posX + highlight.width
          );
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
    // return the horizontal highlights for the last layer.
    if (!isVerticalDrag && !filteredHighlights.length)
      filteredHighlights = arr
        .slice(arr.length - 3)
        .filter((highlight: HighlightInfo) =>
          !highlight.isVertical && isFillWidget
            ? highlight.alignment === FlexLayerAlignment.Start
            : true,
        );

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
    usePerpendicularDistance?: boolean,
  ): number => {
    /**
     * Calculate perpendicular distance of a point from a line.
     * If moving vertically, x is fixed (x = 0) and vice versa.
     */
    const isVerticalDrag =
      moveDirection &&
      [ReflowDirection.TOP, ReflowDirection.BOTTOM].includes(moveDirection);

    let distX: number =
      a.isVertical && isVerticalDrag
        ? usePerpendicularDistance
          ? (a.posX + a.width) / 2 - b.x
          : 0
        : a.posX - b.x;
    let distY: number = !a.isVertical && !isVerticalDrag ? 0 : a.posY - b.y;

    if (moveDirection === ReflowDirection.LEFT && distX > 20) distX += 2000;
    if (moveDirection === ReflowDirection.RIGHT && distX < -20) distX -= 2000;
    if (moveDirection === ReflowDirection.TOP && distY > 20) distY += 2000;
    if (moveDirection === ReflowDirection.BOTTOM && distY < -20) distY -= 2000;

    return Math.abs(Math.sqrt(distX * distX + distY * distY));
  };

  const getDropInfo = (val: XYCord): HighlightInfo | undefined => {
    if (lastActiveHighlight) return lastActiveHighlight;

    const payload: HighlightInfo = getHighlightPayload(null, undefined, val);
    if (!payload) return;
    lastActiveHighlight = payload;
    return payload;
  };

  return {
    calculateHighlights,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  };
};
