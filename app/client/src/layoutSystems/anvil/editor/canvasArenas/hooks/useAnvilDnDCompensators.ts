import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { getCompensatorsForHierarchy } from "../utils/dndCompensatorUtils";

export const useAnvilDnDCompensators = (
  canActivate: boolean,
  draggedWidgetHierarchy: number,
  currentWidgetHierarchy: number,
  isEmptyLayout: boolean,
  widgetProps: FlattenedWidgetProps,
) => {
  const isElevatedWidget = !!widgetProps.elevatedBackground;
  const {
    edgeCompensatorValues,
    layoutCompensatorValues,
    widgetCompensatorValues,
  } = getCompensatorsForHierarchy(
    currentWidgetHierarchy,
    isEmptyLayout,
    isElevatedWidget,
  );
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
