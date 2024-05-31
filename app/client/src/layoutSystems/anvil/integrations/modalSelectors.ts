import type { AppState } from "@appsmith/reducers";
import memoize from "micro-memoize";
import { getAllDetachedWidgetIds, getWidgetsMeta } from "sagas/selectors";

const getCurrentlyOpenWidgets = memoize(
  (allExistingDetachedWidgets: string[], metaWidgets: Record<string, any>) => {
    return allExistingDetachedWidgets.filter((detachedWidgetId) => {
      const detachedWidget = metaWidgets[detachedWidgetId];
      return detachedWidget && detachedWidget.isVisible;
    });
  },
);

export const getCurrentlyOpenAnvilDetachedWidgets = (state: AppState) => {
  const allExistingDetachedWidgets = getAllDetachedWidgetIds(
    state.entities.canvasWidgets,
  );
  if (allExistingDetachedWidgets.length === 0) {
    return [];
  }
  const metaWidgets = getWidgetsMeta(state);
  const currentlyOpenWidgets = getCurrentlyOpenWidgets(
    allExistingDetachedWidgets,
    metaWidgets,
  );
  return currentlyOpenWidgets;
};
