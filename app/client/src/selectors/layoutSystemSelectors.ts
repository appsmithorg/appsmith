import type { AppState } from "@appsmith/reducers";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * selector to fetch the application's layout type
 */
export const getLayoutSystemType = (state: AppState) => {
  return state && LayoutSystemTypes.ANVIL;
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
