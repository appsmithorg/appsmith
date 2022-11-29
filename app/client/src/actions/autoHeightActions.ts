import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { TreeNode } from "utils/autoHeight/constants";

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
) {
  return {
    type: ReduxActionTypes.GENERATE_AUTO_HEIGHT_LAYOUT_TREE,
    payload: {
      shouldCheckContainersForAutoHeightUpdates,
      layoutUpdated: !!layoutUpdated,
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

export function checkContainersForAutoHeightAction() {
  return {
    type: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
  };
}
