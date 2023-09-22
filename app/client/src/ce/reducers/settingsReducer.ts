import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import type { TenantReduxState } from "@appsmith/reducers/tenantReducer";
import { tenantConfigConnection } from "@appsmith/constants/tenantConstants";

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
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    state: SettingsReduxState & TenantReduxState<any>,
    action: ReduxAction<TenantReduxState<any>>,
  ) => {
    const configs: any = {};
    tenantConfigConnection.forEach((key: string) => {
      if (action.payload?.tenantConfiguration?.hasOwnProperty(key)) {
        configs[key] = action.payload?.tenantConfiguration?.[key];
      }
    });
    return {
      ...state,
      isLoading: false,
      config: {
        ...state.config,
        ...configs,
      },
    };
  },
  [ReduxActionTypes.UPDATE_TENANT_CONFIG_SUCCESS]: (
    state: SettingsReduxState & TenantReduxState<any>,
    action: ReduxAction<TenantReduxState<any>>,
  ) => {
    const configs: any = {};
    tenantConfigConnection.forEach((key: string) => {
      if (action.payload?.tenantConfiguration?.hasOwnProperty(key)) {
        configs[key] = action.payload?.tenantConfiguration?.[key];
      }
    });
    return {
      ...state,
      isLoading: false,
      config: {
        ...state.config,
        ...configs,
      },
    };
  },
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
