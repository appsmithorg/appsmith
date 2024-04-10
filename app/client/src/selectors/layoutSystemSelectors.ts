import type { AppState } from "@appsmith/reducers";
import { getIsAnvilLayoutEnabled } from "layoutSystems/anvil/integrations/selectors";
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
    const layoutSystemType =
      LayoutSystemTypes[
        state.ui.applications.currentApplication?.applicationDetail
          ?.appPositioning?.type
      ];
    if (layoutSystemType !== LayoutSystemTypes.ANVIL) {
      return layoutSystemType;
    }
    const isAnvilEnabled = getIsAnvilLayoutEnabled(state);
    if (isAnvilEnabled) {
      return LayoutSystemTypes.ANVIL;
    }
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
