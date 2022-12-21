import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { ChangeLanguageAction } from "actions/appViewActions";
import { LanguageEnums } from "entities/App";

const initialState: AppViewReduxState = {
  isFetchingPage: false,
  initialized: false,
  headerHeight: 0,
  lang: LanguageEnums.EN,
};

const appViewReducer = createReducer(initialState, {
  [ReduxActionTypes.RESET_EDITOR_SUCCESS]: (state: AppViewReduxState) => {
    return { ...state, initialized: false };
  },
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
  [ReduxActionTypes.SET_APP_VIEWER_HEADER_HEIGHT]: (
    state: AppViewReduxState,
    action: ReduxAction<number>,
  ) => {
    return {
      ...state,
      headerHeight: action.payload,
    };
  },
  [ReduxActionTypes.CHANGE_LANGUAGE]: (
    state: AppViewReduxState,
    action: ReduxAction<ChangeLanguageAction>,
  ) => {
    return {
      ...state,
      lang: action.payload,
    };
  },
});

export interface AppViewReduxState {
  initialized: boolean;
  isFetchingPage: boolean;
  headerHeight: number;
  lang: LanguageEnums;
}

export default appViewReducer;
