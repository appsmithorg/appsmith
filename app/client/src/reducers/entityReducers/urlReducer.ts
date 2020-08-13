import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";

export type UrlDataState = {
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  href: string;
};

const initialState: UrlDataState = {
  queryParams: {},
  protocol: "",
  host: "",
  hostname: "",
  port: "",
  pathname: "",
  hash: "",
  href: "",
};

const urlReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_URL_DATA]: (
    state: UrlDataState,
    action: ReduxAction<UrlDataState>,
  ) => {
    return action.payload;
  },
});

export default urlReducer;
