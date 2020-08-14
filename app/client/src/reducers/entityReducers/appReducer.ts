import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { User } from "constants/userConstants";

export enum APP_MODE {
  EDIT = "EDIT",
  PUBLISHED = "PUBLISHED",
}

export type AuthUserState = {
  username: string;
  email: string;
  id: string;
};

export type UrlDataState = {
  urlString: string;
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  href: string;
};

export type AppDataState = {
  mode?: APP_MODE;
  user: AuthUserState;
  url: UrlDataState;
};

const initialState: AppDataState = {
  user: {
    username: "",
    email: "",
    id: "",
  },
  url: {
    urlString: "",
    queryParams: {},
    protocol: "",
    host: "",
    hostname: "",
    port: "",
    pathname: "",
    hash: "",
    href: "",
  },
};

const appReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_APP_MODE]: (
    state: AppDataState,
    action: ReduxAction<APP_MODE>,
  ) => {
    return {
      ...state,
      mode: action.payload,
    };
  },
  [ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS]: (
    state: AppDataState,
    action: ReduxAction<User>,
  ) => {
    return {
      ...state,
      user: action.payload,
    };
  },
  [ReduxActionTypes.SET_URL_DATA]: (
    state: AppDataState,
    action: ReduxAction<UrlDataState>,
  ) => {
    return {
      ...state,
      url: action.payload,
    };
  },
});

export default appReducer;
