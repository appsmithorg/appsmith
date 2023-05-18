import type { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Location } from "history";
import type { AppsmithLocationState } from "utils/history";

export type RouteChangeActionPayload = {
  location: Location<AppsmithLocationState>;
};

export const routeChanged = (
  location: Location<AppsmithLocationState>,
): ReduxAction<RouteChangeActionPayload> => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { location },
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
