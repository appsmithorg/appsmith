import type { FlattenedWidgetProps } from "WidgetProvider/constants";
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
  isEmptyLayout: boolean,
  widgetProps: FlattenedWidgetProps,
) => {
  const { mainCanvasSpacing, zoneSpacing } =
    getWidgetSpacingCSSVariableValues();
  const modalSpacing = mainCanvasSpacing;
  const emptyModal = isModalLayout && isEmptyLayout;
  const widgetCompensatorValues = {
    left: isSection && !emptyModal ? mainCanvasSpacing : 0,
    top: isModalLayout ? (isEmptyLayout ? 0 : modalSpacing) : 0,
  };
  const dynamicZoneSpacing = !!widgetProps.elevatedBackground ? zoneSpacing : 0;

  // Define compensator values for edges
  const edgeCompensatorValues = {
    left: calculateEdgeLeftCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      isEmptyLayout,
      mainCanvasSpacing,
      dynamicZoneSpacing,
    ),
    top: calculateEdgeTopCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      isEmptyLayout,
      mainCanvasSpacing,
      dynamicZoneSpacing,
      modalSpacing,
    ),
  };

  // Define compensator values for layout
  const layoutCompensatorValues = {
    left: calculateLayoutLeftCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      isEmptyLayout,
      mainCanvasSpacing,
      dynamicZoneSpacing,
    ),
    top: calculateLayoutTopCompensator(
      isMainCanvas,
      isSection,
      isModalLayout,
      isEmptyLayout,
      dynamicZoneSpacing,
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
