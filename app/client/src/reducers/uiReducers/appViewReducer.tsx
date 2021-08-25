import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: AppViewReduxState = {
  isFetchingPage: false,
  initialized: false,
};

const appViewReducer = createReducer(initialState, {
  [ReduxActionTypes.INITIALIZE_PAGE_VIEWER]: (state: AppViewReduxState) => {
    return { ...state, initialized: false };
  },
  [ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS]: (
    state: AppViewReduxState,
  ) => {
    return { ...state, initialized: true };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT]: (state: AppViewReduxState) => {
    return { ...state, isFetchingPage: true };
  },
  [ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR]: (
    state: AppViewReduxState,
  ) => {
    return { ...state, isFetchingPage: false };
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: (
    state: AppViewReduxState,
  ) => {
    return {
      ...state,
      isFetchingPage: false,
    };
  },
});

export interface AppViewReduxState {
  initialized: boolean;
  isFetchingPage: boolean;
}

export default appViewReducer;
