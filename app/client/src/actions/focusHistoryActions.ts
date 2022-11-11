import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const routeChanged = (pathname: string, hash?: string) => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { pathname, hash },
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
