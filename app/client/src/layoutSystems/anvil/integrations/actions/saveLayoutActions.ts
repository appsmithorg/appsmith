import type {
  CanvasWidgetsReduxState,
  CrudWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
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

export const performAnvilChecks = (updates: CrudWidgetsPayload) => {
  return {
    type: AnvilReduxActionTypes.PERFORM_ANVIL_CHECKS_BEFORE_UPDATE,
    payload: { updates },
  };
};
