import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const routeChanged = (pathname: string) => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { pathname },
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
