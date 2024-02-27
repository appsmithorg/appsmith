import type { AppState } from "@appsmith/reducers";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * selector to fetch the application's layout type
 */
export const getLayoutSystemType = (state: AppState) => {
  if (
    state.ui.applications?.currentApplication?.applicationDetail?.appPositioning
      ?.type
  ) {
    return LayoutSystemTypes[
      state.ui.applications.currentApplication?.applicationDetail
        ?.appPositioning?.type
    ];
  }
  return LayoutSystemTypes.FIXED;
};

export const getWidgetSelectorByWidgetId = (
  state: AppState,
  widgetId: string,
) => {
  const layoutSystemType = getLayoutSystemType(state);
  switch (layoutSystemType) {
    case LayoutSystemTypes.ANVIL:
      return getAnvilWidgetDOMId(widgetId);
    default:
      return widgetId;
  }
};
