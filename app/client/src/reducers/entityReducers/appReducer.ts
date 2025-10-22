import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { User } from "constants/userConstants";
import type { APP_MODE } from "entities/App";

export interface AuthUserState {
  username: string;
  email: string;
  id: string;
}

export interface UrlDataState {
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  fullPath: string;
}

export type AppStoreState = Record<string, unknown>;

export interface AppDataState {
  mode?: APP_MODE;
  user: AuthUserState;
  URL: UrlDataState;
  store: AppStoreState;
  geolocation: {
    canBeRequested: boolean;
    currentPosition?: Partial<GeolocationPosition>;
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflows: Record<string, any>;
  isStaticUrlEnabled: boolean;
  pageSlug: Record<string, { isPersisting: boolean; isError: boolean }>;
  pageSlugValidation: { isValidating: boolean; isValid: boolean };
}

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
  workflows: {},
  isStaticUrlEnabled: false,
  pageSlug: {},
  pageSlugValidation: { isValidating: false, isValid: true },
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
  [ReduxActionTypes.TOGGLE_STATIC_URL]: (
    state: AppDataState,
    action: ReduxAction<{ isEnabled: boolean; applicationId?: string }>,
  ): AppDataState => {
    return {
      ...state,
      isStaticUrlEnabled: action.payload.isEnabled,
    };
  },
  [ReduxActionTypes.PERSIST_PAGE_SLUG]: (
    state: AppDataState,
    action: ReduxAction<{ pageId: string; slug: string }>,
  ) => {
    return {
      ...state,
      pageSlug: {
        ...state.pageSlug,
        [action.payload.pageId]: {
          isPersisting: true,
          isError: false,
        },
      },
    };
  },
  [ReduxActionTypes.PERSIST_PAGE_SLUG_SUCCESS]: (
    state: AppDataState,
    action: ReduxAction<{ pageId: string; slug: string }>,
  ) => {
    return {
      ...state,
      pageSlug: {
        ...state.pageSlug,
        [action.payload.pageId]: {
          isPersisting: false,
          isError: false,
        },
      },
    };
  },
  [ReduxActionTypes.PERSIST_PAGE_SLUG_ERROR]: (
    state: AppDataState,
    action: ReduxAction<{ pageId: string; slug: string; error: unknown }>,
  ) => {
    return {
      ...state,
      pageSlug: {
        ...state.pageSlug,
        [action.payload.pageId]: {
          isPersisting: false,
          isError: true,
        },
      },
    };
  },
  [ReduxActionTypes.VALIDATE_PAGE_SLUG]: (state: AppDataState) => {
    return {
      ...state,
      pageSlugValidation: {
        isValidating: true,
        isValid: true, // Reset to valid while validating
      },
    };
  },
  [ReduxActionTypes.VALIDATE_PAGE_SLUG_SUCCESS]: (
    state: AppDataState,
    action: ReduxAction<{ slug: string; isValid: boolean }>,
  ) => {
    return {
      ...state,
      pageSlugValidation: {
        isValidating: false,
        isValid: action.payload.isValid,
      },
    };
  },
  [ReduxActionTypes.VALIDATE_PAGE_SLUG_ERROR]: (
    state: AppDataState,
    action: ReduxAction<{ slug: string; isValid: boolean }>,
  ) => {
    return {
      ...state,
      pageSlugValidation: {
        isValidating: false,
        isValid: action.payload.isValid,
      },
    };
  },
});

export default appReducer;
