import {
  FlexLayerAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import { useSelector } from "react-redux";
import { ReflowDirection } from "reflow/reflowTypes";
import { getWidgets } from "sagas/selectors";
import { getCanvasWidth } from "selectors/editorSelectors";
import { getIsMobile } from "selectors/mainCanvasSelectors";
import { deriveHighlightsFromLayers } from "utils/autoLayout/highlightUtils";
import WidgetFactory from "utils/WidgetFactory";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

interface Point {
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
  canvasId: string; // widgetId of the canvas to which the highlight belongs.
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
  const canvasWidth: number = useSelector(getCanvasWidth);
  const isMobile = useSelector(getIsMobile);
  let highlights: HighlightInfo[] = [];
  let lastActiveHighlight: HighlightInfo | undefined;
  let isFillWidget = false;

  /**
   * START AUTO LAYOUT OFFSET CALCULATION
   */

  const cleanUpTempStyles = () => {
    // reset state
    lastActiveHighlight = undefined;
    highlights = [];
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
      isFillWidget = checkForFillWidget();
      highlights = deriveHighlightsFromLayers(
        allWidgets,
        canvasId,
        canvasWidth,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );
    }
    // console.log("#### highlights", highlights);
    return highlights;
  };

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  /**
   * Highlight a drop position based on mouse position and move direction.
   * @param e | MouseMoveEvent
   * @param moveDirection | ReflowDirection
   * @returns HighlightInfo | undefined
   */
  const highlightDropPosition = (
    e: any,
    moveDirection: ReflowDirection,
  ): HighlightInfo | undefined => {
    const highlight: HighlightInfo | undefined = getHighlightPayload(
      e,
      moveDirection,
    );
    if (!highlight) return;
    // console.log("#### selection", highlight);
    lastActiveHighlight = highlight;
    return highlight;
  };

  const getHighlightPayload = (
    e: any,
    moveDirection?: ReflowDirection,
    val?: Point,
  ): HighlightInfo | undefined => {
    let base: HighlightInfo[] = []; // all highlight for the current canvas.
    if (!highlights || !highlights.length)
      highlights = deriveHighlightsFromLayers(
        allWidgets,
        canvasId,
        canvasWidth,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );
    base = highlights;
    // Current mouse coordinates.
    const pos: Point = {
      x: e?.offsetX || val?.x,
      y: e?.offsetY || val?.y,
    };

    let filteredHighlights: HighlightInfo[] = [];
    filteredHighlights = getViableDropPositions(base, pos, moveDirection);
    if (!filteredHighlights || !filteredHighlights?.length) return;
    // Sort filtered highlights in ascending order of distance from mouse position.
    const arr = [...filteredHighlights]?.sort((a, b) => {
      return (
        calculateDistance(a, pos, moveDirection) -
        calculateDistance(b, pos, moveDirection)
      );
    });

    // console.log("#### arr", arr, base, moveDirection);

    // Return the closest highlight.
    return arr[0];
  };

  function getViableDropPositions(
    arr: HighlightInfo[],
    pos: Point,
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
    pos: Point,
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
    /**
     * For horizontal drag, if no vertical highlight exists in the same x plane,
     * return the horizontal highlights for the last layer.
     * In case of a dragged Fill widget, only return the Start alignment as it will span the entire width.
     */
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
    pos: Point,
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

  /**
   * Calculate distance between the mouse position and the closest point on the highlight.
   *
   * @param a | HighlightInfo : current highlight.
   * @param b | Point : current mouse position.
   * @param moveDirection | ReflowDirection : current drag direction.
   * @returns number
   */
  function calculateDistance(
    a: HighlightInfo,
    b: Point,
    moveDirection?: ReflowDirection,
  ): number {
    let distX = 0,
      distY = 0;
    if (a.isVertical) {
      distX = b.x - a.posX;
      if (b.y < a.posY) {
        distY = b.y - a.posY;
      } else if (b.y > a.posY + a.height) {
        distY = b.y - (a.posY + a.height);
      } else {
        distY = 0;
      }
    } else {
      distY = b.y - a.posY;
      if (b.x < a.posX) {
        distX = b.x - a.posX;
      } else if (b.x > a.posX + a.width) {
        distX = b.x - (a.posX + a.width);
      } else {
        distX = 0;
      }
    }

    /**
     * Emphasize move direction over actual distance.
     *
     * If the point is close to a highlight. However, it is moving in the opposite direction,
     * then increase the appropriate distance to ensure that this highlight is discounted.
     */
    if (moveDirection === ReflowDirection.RIGHT && distX > 20) distX += 2000;
    if (moveDirection === ReflowDirection.LEFT && distX < -20) distX -= 2000;
    if (moveDirection === ReflowDirection.BOTTOM && distY > 20) distY += 2000;
    if (moveDirection === ReflowDirection.TOP && distY < -20) distY -= 2000;

    return Math.abs(Math.sqrt(distX * distX + distY * distY));
  }

  const getDropInfo = (val: Point): HighlightInfo | undefined => {
    if (lastActiveHighlight) return lastActiveHighlight;

    const payload: HighlightInfo | undefined = getHighlightPayload(
      null,
      undefined,
      val,
    );
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
