import {
  calculateEdgeLeftCompensator,
  calculateEdgeTopCompensator,
  calculateLayoutLeftCompensator,
  calculateLayoutTopCompensator,
  getWidgetSpacingCSSVariableValues,
} from "../utils/dndCompensatorUtils";

export const useAnvilDnDCompensators = (
  isMainCanvas: boolean,
  isSection: boolean,
  isModalLayout: boolean,
) => {
  const { mainCanvasSpacing, zoneSpacing } =
    getWidgetSpacingCSSVariableValues();
  const modalSpacing = mainCanvasSpacing;

  const widgetCompensatorValues = {
    left: isSection ? mainCanvasSpacing : 0,
    top: isModalLayout ? modalSpacing : 0,
  };

  // Define compensator values for edges
  const edgeCompensatorValues = {
    left: calculateEdgeLeftCompensator(
      isMainCanvas,
      isSection,
      mainCanvasSpacing,
      zoneSpacing,
    ),
    top: calculateEdgeTopCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      mainCanvasSpacing,
      zoneSpacing,
      modalSpacing,
    ),
  };

  // Define compensator values for layout
  const layoutCompensatorValues = {
    left: calculateLayoutLeftCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      mainCanvasSpacing,
      zoneSpacing,
    ),
    top: calculateLayoutTopCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      zoneSpacing,
      modalSpacing,
    ),
  };

  const zIndex = isSection || isModalLayout ? 0 : 1;
  return {
    edgeCompensatorValues,
    layoutCompensatorValues,
    widgetCompensatorValues,
    zIndex,
  };
};
