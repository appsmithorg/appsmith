import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export const initialState: ProvisioningReduxState = {
  isLoading: {
    apiKey: false,
    provisionStatus: false,
    disconnectProvisioning: false,
  },
  configuredStatus: false,
  apiKey: "",
  provisionStatus: "inactive",
  provisionedUsers: 0,
  provisionedGroups: 0,
  lastUpdatedAt: "",
};

export interface ProvisioningReduxState {
  isLoading: {
    apiKey: boolean;
    provisionStatus: boolean;
    disconnectProvisioning: boolean;
  };
  configuredStatus: boolean;
  apiKey: string;
  provisionStatus: string;
  provisionedUsers: number;
  provisionedGroups: number;
  lastUpdatedAt?: string;
}

export const handlers = {
  [ReduxActionTypes.FETCH_PROVISIONING_STATUS]: (
    state: ProvisioningReduxState,
  ) => ({
    ...state,
    isLoading: {
      ...state.isLoading,
      provisionStatus: true,
    },
  }),
  [ReduxActionTypes.FETCH_PROVISIONING_STATUS_SUCCESS]: (
    state: ProvisioningReduxState,
    action: ReduxAction<ProvisioningReduxState>,
  ) => ({
    ...state,
    ...action.payload,
    isLoading: {
      ...state.isLoading,
      provisionStatus: false,
    },
  }),
  [ReduxActionTypes.DISCONNECT_PROVISIONING]: (
    state: ProvisioningReduxState,
  ) => ({
    ...state,
    isLoading: {
      ...state.isLoading,
      disconnectProvisioning: true,
    },
  }),
  [ReduxActionTypes.DISCONNECT_PROVISIONING_SUCCESS]: () => ({
    ...initialState,
  }),
  [ReduxActionTypes.GENERATE_PROVISIONING_API_KEY]: (
    state: ProvisioningReduxState,
  ) => ({
    ...state,
    isLoading: {
      ...state.isLoading,
      apiKey: true,
    },
  }),
  [ReduxActionTypes.GENERATE_PROVISIONING_API_KEY_SUCCESS]: (
    state: ProvisioningReduxState,
    action: ReduxAction<string>,
  ) => ({
    ...state,
    apiKey: action.payload,
    isLoading: {
      ...state.isLoading,
      apiKey: false,
    },
  }),
};

export default createReducer(initialState, handlers);
