import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { User } from "constants/userConstants";
import type { APP_MODE } from "entities/App";

export type AuthUserState = {
  username: string;
  email: string;
  id: string;
};

export type UrlDataState = {
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  fullPath: string;
};

export type AppStoreState = Record<string, unknown>;

export type AppDataState = {
  mode?: APP_MODE;
  user: AuthUserState;
  URL: UrlDataState;
  store: AppStoreState;
  geolocation: {
    canBeRequested: boolean;
    currentPosition?: Partial<GeolocationPosition>;
  };
};

const initialState: AppDataState = {
  user: {
    username: "",
    email: "",
    id: "",
  },
  URL: {
    queryParams: {},
    protocol: "",
    host: "",
    hostname: "",
    port: "",
    pathname: "",
    hash: "",
    fullPath: "",
  },
  store: {},
  geolocation: {
    canBeRequested: "geolocation" in navigator,
    currentPosition: {},
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
      URL: action.payload,
    };
  },
  [ReduxActionTypes.UPDATE_APP_STORE]: (
    state: AppDataState,
    action: ReduxAction<Record<string, unknown>>,
  ) => {
    return {
      ...state,
      store: action.payload,
    };
  },
  [ReduxActionTypes.SET_USER_CURRENT_GEO_LOCATION]: (
    state: AppDataState,
    action: ReduxAction<{ position: GeolocationPosition }>,
  ): AppDataState => {
    return {
      ...state,
      geolocation: {
        ...state.geolocation,
        currentPosition: action.payload.position,
      },
    };
  },
});

export default appReducer;
