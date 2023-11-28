import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AnvilReduxActionTypes } from "./actionTypes";
import type { updateLayoutOptions } from "actions/pageActions";

export const saveAnvilLayout = (
  widgets: CanvasWidgetsReduxState,
  options: updateLayoutOptions = {},
) => {
  const { isRetry, shouldReplay, updatedWidgetIds } = options;
  return {
    type: AnvilReduxActionTypes.SAVE_ANVIL_LAYOUT,
    payload: { widgets, isRetry, shouldReplay, updatedWidgetIds },
  };
};
