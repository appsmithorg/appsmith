import type { AppState } from "@appsmith/reducers";
import { getIsAnvilLayoutEnabled } from "layoutSystems/anvil/integrations/selectors";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * Returns the layout system type based on the state of the application.
 * @param state - The current state of the application.
 * @returns The layout system type.
 */
export const getLayoutSystemType = (state: AppState) => {
  // Check if the application has a defined appPositioning type
  if (
    state.ui.applications?.currentApplication?.applicationDetail?.appPositioning
      ?.type
  ) {
    // Get the layout system type based on the appPositioning type
    const layoutSystemType =
      LayoutSystemTypes[
        state.ui.applications.currentApplication?.applicationDetail
          ?.appPositioning?.type
      ];
    // If the layout system type is not ANVIL, return it
    if (layoutSystemType !== LayoutSystemTypes.ANVIL) {
      return layoutSystemType;
    }
    // Check if the ANVIL layout system is enabled
    const isAnvilEnabled = getIsAnvilLayoutEnabled(state);
    // If ANVIL is enabled, return ANVIL as the layout system type
    if (isAnvilEnabled) {
      return LayoutSystemTypes.ANVIL;
    }
  }
  // If no layout system type is found, return FIXED as the default layout system type
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

export const isFixedLayoutSelector = (state: AppState) =>
  getLayoutSystemType(state) === LayoutSystemTypes.FIXED;
