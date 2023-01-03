import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { Location } from "history";
import { AppsmithLocationState } from "utils/history";

export const routeChanged = (location: Location<AppsmithLocationState>) => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { location },
  };
};
export const pageChanged = (
  pageId: string,
  currPath: string,
  currParamString: string,
  fromPath: string,
  fromParamString: string,
) => {
  return {
    type: ReduxActionTypes.PAGE_CHANGED,
    payload: {
      pageId,
      currPath,
      currParamString,
      fromPath,
      fromParamString,
    },
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
