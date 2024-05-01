import type { AppState } from "@appsmith/reducers";
import { getAllDetachedWidgetIds, getWidgetsMeta } from "sagas/selectors";

export const getCurrentlyOpenAnvilDetachedWidgets = (state: AppState) => {
  const allExistingDetachedWidgets = getAllDetachedWidgetIds(state);
  if (allExistingDetachedWidgets.length === 0) {
    return [];
  }
  const metaWidgets = getWidgetsMeta(state);
  const currentlyOpenWidgets = allExistingDetachedWidgets.filter((modalId) => {
    const modal = metaWidgets[modalId];
    return modal && modal.isVisible;
  });
  return currentlyOpenWidgets;
};
