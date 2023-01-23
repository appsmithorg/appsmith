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
import {
  getHighlightPayload,
  Point,
} from "utils/autoLayout/highlightSelectionUtils";

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
    if (!highlights || !highlights.length)
      highlights = deriveHighlightsFromLayers(
        allWidgets,
        canvasId,
        canvasWidth,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );

    const highlight: HighlightInfo | undefined = getHighlightPayload(
      highlights,
      direction,
      isFillWidget,
      e,
      moveDirection,
    );
    if (!highlight) return;
    // console.log("#### selection", highlight);
    lastActiveHighlight = highlight;
    return highlight;
  };

  const getDropInfo = (val: Point): HighlightInfo | undefined => {
    if (lastActiveHighlight) return lastActiveHighlight;

    if (!highlights || !highlights.length)
      highlights = deriveHighlightsFromLayers(
        allWidgets,
        canvasId,
        canvasWidth,
        blocksToDraw.map((block) => block?.widgetId),
        isFillWidget,
        isMobile,
      );

    const payload: HighlightInfo | undefined = getHighlightPayload(
      highlights,
      direction,
      isFillWidget,
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
