import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { Location } from "history";
import { AppsmithLocationState } from "utils/history";

export const routeChanged = (location: Location<AppsmithLocationState>) => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: location,
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
