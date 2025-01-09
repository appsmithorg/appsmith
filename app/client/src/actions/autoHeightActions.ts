import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { GridDefaults } from "constants/WidgetConstants";
import type { TreeNode } from "utils/autoHeight/constants";

export interface UpdateWidgetAutoHeightPayload {
  widgetId: string;
  height: number;
}

export function setAutoHeightLayoutTreeAction(
  tree: Record<string, TreeNode>,
  canvasLevelMap: Record<string, number>,
) {
  return {
    type: ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE,
    payload: { tree, canvasLevelMap },
  };
}

export function generateAutoHeightLayoutTreeAction(
  shouldCheckContainersForAutoHeightUpdates: boolean,
  layoutUpdated?: boolean,
  resettingTabs?: boolean,
) {
  return {
    type: ReduxActionTypes.GENERATE_AUTO_HEIGHT_LAYOUT_TREE,
    payload: {
      shouldCheckContainersForAutoHeightUpdates,
      layoutUpdated: !!layoutUpdated,
      resettingTabs: !!resettingTabs,
    },
  };
}

export function updateWidgetAutoHeightAction(
  widgetId: string,
  height: number,
): ReduxAction<UpdateWidgetAutoHeightPayload> {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
    payload: {
      widgetId,
      height,
    },
  };
}

export function checkContainersForAutoHeightAction(resettingTabs?: boolean) {
  return {
    type: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
    payload: {
      resettingTabs: !!resettingTabs,
    },
  };
}

export function updateDOMDirectlyBasedOnAutoHeightAction(
  widgetId: string,
  height: number,
) {
  return {
    type: ReduxActionTypes.DIRECT_DOM_UPDATE_AUTO_HEIGHT,
    payload: {
      height: height * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      widgetId,
    },
  };
}
