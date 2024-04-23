import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { HIGHLIGHT_SIZE } from "layoutSystems/anvil/utils/constants";
import { getAnvilCanvasId } from "layoutSystems/anvil/viewer/canvas/utils";

const WidgetSpacing = {
  MAIN_CANVAS: "--outer-spacing-4",
  ZONE: "--outer-spacing-3",
};

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
  };
};
export const getWidgetSpacingCSSVariableValues = () => {
  const mainCanvasDom = document.getElementById(
    getAnvilCanvasId(MAIN_CONTAINER_WIDGET_ID),
  );
  if (!mainCanvasDom) {
    return {
      mainCanvasSpacing: 0,
      zoneSpacing: 0,
    };
  }
  return extractSpacingStyleValues(mainCanvasDom);
};

// Function to calculate edge left value
export const calculateEdgeLeftCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  isEmptyLayout: boolean,
  mainCanvasSpacing: number,
  zoneSpacing: number,
) => {
  switch (true) {
    case isMainCanvas:
      return isEmptyLayout ? -mainCanvasSpacing : 0;
    case isSection:
      return mainCanvasSpacing;
    case isModalLayout:
      return 0;
    default:
      return zoneSpacing;
  }
};

// Function to calculate edge top value
export const calculateEdgeTopCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  isEmptyLayout: boolean,
  mainCanvasSpacing: number,
  zoneSpacing: number,
  modalSpacing: number,
) => {
  switch (true) {
    case isSection:
      return 0;
    case isMainCanvas:
      if (isEmptyLayout) {
        return -mainCanvasSpacing;
      }
      return mainCanvasSpacing;
    case isModalLayout:
      if (isEmptyLayout) {
        return 0;
      }
      return modalSpacing * 0.5;
    default:
      return zoneSpacing;
  }
};

// Function to calculate layout left value
export const calculateLayoutLeftCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  isEmptyLayout: boolean,
  mainCanvasSpacing: number,
  zoneSpacing: number,
) => {
  switch (true) {
    case isMainCanvas:
      return 0;
    case isModalLayout:
      if (isEmptyLayout) {
        return HIGHLIGHT_SIZE;
      }
      return 0;
    case isSection:
      return mainCanvasSpacing;
    default:
      return zoneSpacing;
  }
};

// Function to calculate layout top value
export const calculateLayoutTopCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  isEmptyLayout: boolean,
  zoneSpacing: number,
  modalSpacing: number,
) => {
  switch (true) {
    case isSection:
    case isMainCanvas:
      return 0;
    case isModalLayout:
      if (isEmptyLayout) {
        return HIGHLIGHT_SIZE;
      }
      return modalSpacing;
    default:
      return zoneSpacing;
  }
};

const calculateEdgeTopOffset = (
  isVertical: boolean,
  isTopEdge: boolean,
  isBottomEdge: boolean,
  topGap: number,
) => {
  return !isVertical ? (isTopEdge ? -topGap : isBottomEdge ? topGap : 0) : 0;
};

const calculateEdgeLeftOffset = (
  isVertical: boolean,
  isLeftEdge: boolean,
  isRightEdge: boolean,
  leftGap: number,
) => {
  return isVertical ? (isLeftEdge ? -leftGap : isRightEdge ? leftGap : 0) : 0;
};

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
