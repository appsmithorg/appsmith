import type { AppState } from "ee/reducers";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 * Returns the layout system type based on the state of the application.
 * @param state - The current state of the application.
 * @returns The layout system type.
 */
export const getLayoutSystemType = (state: AppState) => {
  const applicationLayoutSystemType =
    state.ui.applications?.currentApplication?.applicationDetail?.appPositioning
      ?.type;
  // Check if the application has a defined appPositioning type
  if (applicationLayoutSystemType) {
    // Get the layout system type based on the appPositioning type
    const layoutSystemType = LayoutSystemTypes[applicationLayoutSystemType];
    return layoutSystemType;
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
