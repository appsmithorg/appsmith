import type { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action, Location } from "history";
import type { AppsmithLocationState } from "utils/history";

export type RouteChangeActionPayload = {
  location: Location<AppsmithLocationState>;
  action: Action;
};

export const routeChanged = (
  location: Location<AppsmithLocationState>,
  action: Action,
): ReduxAction<RouteChangeActionPayload> => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { location, action },
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
