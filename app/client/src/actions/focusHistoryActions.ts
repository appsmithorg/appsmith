import type { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import type { ReduxAction } from "./ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Location } from "history";
import type { AppsmithLocationState } from "utils/history";

export interface RouteChangeActionPayload {
  location: Location<AppsmithLocationState>;
  prevLocation: Location<AppsmithLocationState>;
}

export const routeChanged = (
  location: Location<AppsmithLocationState>,
  prevLocation: Location<AppsmithLocationState>,
): ReduxAction<RouteChangeActionPayload> => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { location, prevLocation },
  };
};

export const storeFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};

export const removeFocusHistory = (key: string) => {
  return {
    type: ReduxActionTypes.REMOVE_FOCUS_HISTORY,
    payload: { key },
  };
};
