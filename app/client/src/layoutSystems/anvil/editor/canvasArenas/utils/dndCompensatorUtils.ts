import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
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
  mainCanvasSpacing: number,
  zoneSpacing: number,
) => {
  if (isMainCanvas) {
    return 0;
  } else if (isSection) {
    return mainCanvasSpacing;
  } else {
    return zoneSpacing;
  }
};

// Function to calculate edge top value
export const calculateEdgeTopCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  mainCanvasSpacing: number,
  zoneSpacing: number,
  modalSpacing: number,
) => {
  if (isSection) {
    return 0;
  } else if (isMainCanvas) {
    return mainCanvasSpacing;
  } else if (isModalLayout) {
    return modalSpacing * 0.5;
  } else {
    return zoneSpacing;
  }
};

// Function to calculate layout left value
export const calculateLayoutLeftCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  mainCanvasSpacing: number,
  zoneSpacing: number,
) => {
  if (isMainCanvas || isModalLayout) {
    return 0;
  } else if (isSection) {
    return mainCanvasSpacing;
  } else {
    return zoneSpacing;
  }
};

// Function to calculate layout top value
export const calculateLayoutTopCompensator = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
  zoneSpacing: number,
  modalSpacing: number,
) => {
  if (isSection) {
    return 0;
  } else if (isMainCanvas) {
    return 0;
  } else if (isModalLayout) {
    return modalSpacing;
  } else {
    return zoneSpacing;
  }
};
