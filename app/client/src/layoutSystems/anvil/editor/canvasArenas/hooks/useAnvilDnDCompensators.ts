import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import {
  calculateEdgeLeftCompensator,
  calculateEdgeTopCompensator,
  calculateLayoutLeftCompensator,
  calculateLayoutTopCompensator,
  getWidgetSpacingCSSVariableValues,
} from "../utils/dndCompensatorUtils";

export const useAnvilDnDCompensators = (
  canActivate: boolean,
  draggedWidgetHierarchy: number,
  currentWidgetHierarchy: number,
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
  // to make sure main canvas and modal are both treated alike
  const currentHierarchy = Math.max(currentWidgetHierarchy, 1);
  const zIndex =
    canActivate && currentHierarchy < draggedWidgetHierarchy - 1 ? 0 : 1;
  return {
    edgeCompensatorValues,
    layoutCompensatorValues,
    widgetCompensatorValues,
    zIndex,
  };
};
