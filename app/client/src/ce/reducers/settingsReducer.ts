import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export const initialState: SettingsReduxState = {
  isLoading: false,
  isSaving: false,
  isRestarting: false,
  showReleaseNotes: false,
  isRestartFailed: false,
  config: {},
};

export interface SettingsReduxState {
  isLoading: boolean;
  isSaving: boolean;
  isRestarting: boolean;
  showReleaseNotes: boolean;
  isRestartFailed: boolean;
  config: {
    [key: string]: string | boolean;
  };
}

export const handlers = {
  [ReduxActionTypes.FETCH_ADMIN_SETTINGS]: (state: SettingsReduxState) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ADMIN_SETTINGS_SUCCESS]: (
    state: SettingsReduxState,
    action: ReduxAction<SettingsReduxState>,
  ) => ({
    ...state,
    isLoading: false,
    config: {
      ...state.config,
      ...action.payload,
    },
  }),
  [ReduxActionTypes.FETCH_ADMIN_SETTINGS_ERROR]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.SAVE_ADMIN_SETTINGS]: (state: SettingsReduxState) => ({
    ...state,
    isSaving: true,
  }),
  [ReduxActionTypes.SAVE_ADMIN_SETTINGS_ERROR]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionTypes.SAVE_ADMIN_SETTINGS_SUCCESS]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionTypes.TOGGLE_RELEASE_NOTES]: (
    state: SettingsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    showReleaseNotes: action.payload,
  }),
  [ReduxActionTypes.RESTART_SERVER_POLL]: (state: SettingsReduxState) => ({
    ...state,
    isRestarting: true,
  }),
  [ReduxActionTypes.RETRY_RESTART_SERVER_POLL]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isRestarting: true,
    isRestartFailed: false,
  }),
  [ReduxActionErrorTypes.RESTART_SERVER_ERROR]: (
    state: SettingsReduxState,
  ) => ({
    ...state,
    isRestartFailed: true,
  }),
};

export default createReducer(initialState, handlers);
