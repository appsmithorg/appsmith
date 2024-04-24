import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { HIGHLIGHT_SIZE } from "layoutSystems/anvil/utils/constants";
import { getAnvilCanvasId } from "layoutSystems/anvil/viewer/canvas/utils";

/**
 * Widget spacing CSS variables
 */
const WidgetSpacing = {
  MAIN_CANVAS: "--outer-spacing-4",
  ZONE: "--outer-spacing-3",
  MODAL_TOP: "--outer-spacing-2",
  MODAL_LEFT: "--outer-spacing-4",
};

/**
 * Extract spacing style values from the main canvas
 */
const extractSpacingStyleValues = (mainCanvasDom: HTMLElement) => {
  const computedStyles = getComputedStyle(mainCanvasDom);

  return {
    mainCanvasSpacing: parseInt(
      computedStyles.getPropertyValue(WidgetSpacing.MAIN_CANVAS),
      10,
    ),
    zoneSpacing: parseInt(
      computedStyles.getPropertyValue(WidgetSpacing.ZONE),
      10,
    ),
    modalSpacing: {
      top: parseInt(
        computedStyles.getPropertyValue(WidgetSpacing.MODAL_TOP),
        10,
      ),
      left: parseInt(
        computedStyles.getPropertyValue(WidgetSpacing.MODAL_LEFT),
        10,
      ),
    },
  };
};
/**
 * Get widget spacing CSS variable values
 */
const getWidgetSpacingCSSVariableValues = () => {
  const mainCanvasDom = document.getElementById(
    getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID),
  );
  if (!mainCanvasDom) {
    return {
      mainCanvasSpacing: 0,
      zoneSpacing: 0,
      modalSpacing: {
        top: 0,
        left: 0,
      },
    };
  }
  return extractSpacingStyleValues(mainCanvasDom);
};

/**
 * Get compensators for the main canvas widget
 */
const getMainCanvasCompensators = (
  isEmptyLayout: boolean,
  mainCanvasSpacing: number,
) => {
  const widgetCompensatorValues = {
    left: 0,
    top: 0,
  };
  const edgeCompensatorValues = {
    left: isEmptyLayout ? -mainCanvasSpacing : 0,
    top: isEmptyLayout ? -mainCanvasSpacing : mainCanvasSpacing,
  };
  const layoutCompensatorValues = {
    left: 0,
    top: 0,
  };
  return {
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
  };
};

/**
 * Get compensators for the section widget
 */
const getSectionCompensators = (mainCanvasSpacing: number) => {
  const widgetCompensatorValues = {
    left: mainCanvasSpacing,
    top: 0,
  };
  return {
    widgetCompensatorValues,
    edgeCompensatorValues: widgetCompensatorValues,
    layoutCompensatorValues: widgetCompensatorValues,
  };
};
/**
 * Get compensators for the modal widget
 */
const getModalCompensators = (
  isEmptyLayout: boolean,
  modalSpacing: {
    top: number;
    left: number;
  },
) => {
  const widgetCompensatorValues = {
    left: 0,
    top: isEmptyLayout ? 0 : modalSpacing.top,
  };
  const edgeCompensatorValues = {
    left: 0,
    top: isEmptyLayout ? 0 : modalSpacing.top,
  };
  const layoutCompensatorValues = {
    left: isEmptyLayout ? HIGHLIGHT_SIZE : 0,
    top: isEmptyLayout ? HIGHLIGHT_SIZE : modalSpacing.top,
  };
  return {
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues,
  };
};

/**
 * Get compensators for the zone widget
 */
const getZoneCompensators = (
  zoneSpacing: number,
  isElevatedWidget: boolean,
) => {
  const dynamicZoneSpacing = isElevatedWidget ? zoneSpacing : 0;
  const widgetCompensatorValues = {
    left: 0,
    top: 0,
  };
  const edgeCompensatorValues = {
    left: dynamicZoneSpacing,
    top: dynamicZoneSpacing,
  };
  return {
    widgetCompensatorValues,
    edgeCompensatorValues,
    layoutCompensatorValues: edgeCompensatorValues,
  };
};

/**
 * Get compensators for the widget based on the hierarchy
 */
export const getCompensatorsForHierarchy = (
  hierarchy: number,
  isEmptyLayout: boolean,
  isElevatedWidget: boolean,
) => {
  const { mainCanvasSpacing, modalSpacing, zoneSpacing } =
    getWidgetSpacingCSSVariableValues();
  /**
   * Get compensators based on hierarchy
   * widgetCompensatorValues - compensates for the widget's additional dragging space outside widget and its layout ( Section Widget)
   * edgeCompensatorValues - compensates for the highlights at the edges of the layout of the widget (Zone Widget)
   * layoutCompensatorValues - compensates for the layout's additional dragging space inside widget (Modal Widget)
   */
  switch (true) {
    case hierarchy === 0:
      return getMainCanvasCompensators(isEmptyLayout, mainCanvasSpacing);
    case hierarchy === 1:
      return getModalCompensators(isEmptyLayout, modalSpacing);
    case hierarchy === 2:
      return getSectionCompensators(mainCanvasSpacing);
    case hierarchy === 3:
      return getZoneCompensators(zoneSpacing, isElevatedWidget);
    default:
      return {
        widgetCompensatorValues: {
          left: 0,
          top: 0,
        },
        edgeCompensatorValues: {
          left: 0,
          top: 0,
        },
        layoutCompensatorValues: {
          left: 0,
          top: 0,
        },
      };
  }
};

/**
 * Calculate the top offset based on the edge details
 */
const calculateEdgeTopOffset = (
  isVertical: boolean,
  isTopEdge: boolean,
  isBottomEdge: boolean,
  topGap: number,
) => {
  return !isVertical ? (isTopEdge ? -topGap : isBottomEdge ? topGap : 0) : 0;
};

/**
 * Calculate the left offset based on the edge details
 */
const calculateEdgeLeftOffset = (
  isVertical: boolean,
  isLeftEdge: boolean,
  isRightEdge: boolean,
  leftGap: number,
) => {
  return isVertical ? (isLeftEdge ? -leftGap : isRightEdge ? leftGap : 0) : 0;
};

/**
 * Get the edge compensating offset values
 */
const getEdgeCompensatingOffsetValues = (
  highlight: AnvilHighlightInfo,
  highlightCompensatorValues: {
    top: number;
    left: number;
  },
) => {
  const {
    edgeDetails,
    height: highlightHeight,
    isVertical,
    width: highlightWidth,
  } = highlight;
  const compensatorTop = highlightCompensatorValues.top;
  const compensatorLeft = highlightCompensatorValues.left;
  const {
    bottom: isBottomEdge,
    left: isLeftEdge,
    right: isRightEdge,
    top: isTopEdge,
  } = edgeDetails;
  const topGap = (compensatorTop + highlightHeight) * 0.5;
  const leftGap = (compensatorLeft + highlightWidth) * 0.5;
  const topOffset = calculateEdgeTopOffset(
    isVertical,
    isTopEdge,
    isBottomEdge,
    topGap,
  );
  const leftOffset = calculateEdgeLeftOffset(
    isVertical,
    isLeftEdge,
    isRightEdge,
    leftGap,
  );
  return {
    topOffset,
    leftOffset,
  };
};

/**
 * Get the position compensated highlight
 */
export const getPositionCompensatedHighlight = (
  highlight: AnvilHighlightInfo,
  layoutCompensatorValues: {
    top: number;
    left: number;
  },
  edgeCompensatorValues: {
    top: number;
    left: number;
  },
): AnvilHighlightInfo => {
  const layoutCompensatedHighlight = {
    ...highlight,
    posX: highlight.posX + layoutCompensatorValues.left,
    posY: highlight.posY + layoutCompensatorValues.top,
  };
  const { posX: left, posY: top } = layoutCompensatedHighlight;
  const compensatingOffsetValues = getEdgeCompensatingOffsetValues(
    highlight,
    edgeCompensatorValues,
  );
  const positionUpdatedHighlightInfo = {
    ...layoutCompensatedHighlight,
    posX: left + compensatingOffsetValues.leftOffset,
    posY: top + compensatingOffsetValues.topOffset,
  };
  return positionUpdatedHighlightInfo;
};
