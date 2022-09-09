import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { User } from "constants/userConstants";
import { APP_MODE } from "entities/App";

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

export type AppStoreState = {
  transient: Record<string, unknown>;
  persistent: Record<string, unknown>;
};

export type AppDataState = {
  mode?: APP_MODE;
  user: AuthUserState;
  URL: UrlDataState;
  store: AppStoreState;
  geolocation: {
    canBeRequested: boolean;
    currentPosition?: GeolocationPosition;
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
  store: {
    transient: {},
    persistent: {},
  },
  geolocation: {
    canBeRequested: "geolocation" in navigator,
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
  [ReduxActionTypes.UPDATE_APP_TRANSIENT_STORE]: (
    state: AppDataState,
    action: ReduxAction<Record<string, unknown>>,
  ) => {
    return {
      ...state,
      store: {
        ...state.store,
        transient: action.payload,
      },
    };
  },
  [ReduxActionTypes.UPDATE_APP_PERSISTENT_STORE]: (
    state: AppDataState,
    action: ReduxAction<Record<string, unknown>>,
  ) => {
    return {
      ...state,
      store: {
        ...state.store,
        persistent: action.payload,
      },
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
