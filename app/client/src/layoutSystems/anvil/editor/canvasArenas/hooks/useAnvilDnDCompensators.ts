import { getCompensatorsForHierarchy } from "../utils/dndCompensatorUtils";
import { useThemeContext } from "@appsmith/wds-theming";

export const useAnvilDnDCompensators = (
  canActivate: boolean,
  draggedWidgetHierarchy: number,
  currentWidgetHierarchy: number,
  isEmptyLayout: boolean,
  isElevatedWidget: boolean,
) => {
  const theme = useThemeContext();
  const {
    edgeCompensatorValues,
    layoutCompensatorValues,
    widgetCompensatorValues,
  } = getCompensatorsForHierarchy(
    currentWidgetHierarchy,
    isEmptyLayout,
    isElevatedWidget,
    theme.outerSpacing,
  );
  // to make sure main canvas and modal are both treated alike
  const currentHierarchy = Math.max(currentWidgetHierarchy, 1);

  // zIndex is set in a way that drag layers with least hierarchy(as per the constant widgetHierarchy) are below so that all layers of different hierarchy are accessible for mouse events.
  // also setting zIndex only for layers below the dragged widget to restrict being dropped from lower to upper hierarchy.
  // ex: when a zone is being dragged other zones DnD is not activated,
  // because a zone cannot be dropped into another zone as they are both of same hierarchy.
  // same zIndex with an increment of 1 is set for the highlight(AnvilDnDHighlight) to make sure it is always on top of the dnd listener(AnvilDnDListener).
  const zIndex =
    canActivate && currentHierarchy < draggedWidgetHierarchy - 1 ? 0 : 1;

  return {
    edgeCompensatorValues,
    layoutCompensatorValues,
    widgetCompensatorValues,
    zIndex,
  };
};
