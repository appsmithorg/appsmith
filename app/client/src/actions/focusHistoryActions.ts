import { FocusState } from "reducers/uiReducers/focusHistoryReducer";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const routeChanged = (pathname: string, hash?: string) => {
  return {
    type: ReduxActionTypes.ROUTE_CHANGED,
    payload: { pathname, hash },
  };
};

export const pageChanged = (
  pageId: string,
  currPath: string,
  paramString: string,
) => {
  return {
    type: ReduxActionTypes.PAGE_CHANGED,
    payload: { pageId, currPath, paramString },
  };
};

export const setFocusHistory = (key: string, focusState: FocusState) => {
  return {
    type: ReduxActionTypes.SET_FOCUS_HISTORY,
    payload: { key, focusState },
  };
};
