import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

// Type for one environment
export interface EnvironmentType {
  id: string;
  name: string;
  workspaceId: string;
  isDefault?: boolean;
  userPermissions?: string[];
}

export interface CurrentEnvironmentDetails {
  id: string; // current environment id
  name: string; // current environment name
  appId: string; // app for which the environment is being set
  workspaceId: string; // workspace for which the environment is being set
  editingId: string; // environment id being edited in ds editor mode
}

// Type for the environment state in redux
export interface EnvironmentsReduxState {
  /**
   * @param {boolean} isLoading - Whether the environments are being fetched
   */
  isLoading: boolean;
  /**
   * @param {boolean} error - Whether there was an error while fetching the environments
   */
  error: boolean;
  /**
   * @param {boolean} showEnvInfoModal - Whether to show the environment info modal before deploy
   */
  showEnvDeployInfoModal: boolean;
  /**
   * @param {string} currentEnvironmentDetails - The current environment details (id, name, appId, editingId)
   */
  currentEnvironmentDetails: CurrentEnvironmentDetails;
  /**
   * @param {EnvironmentType} data - The list of environments
   */
  data: EnvironmentType[];
}

// Initial state of the environment state in redux
export const initialEnvironmentState: EnvironmentsReduxState = {
  isLoading: false,
  showEnvDeployInfoModal: false,
  error: false,
  data: [],
  currentEnvironmentDetails: {
    id: "",
    name: "",
    appId: "",
    workspaceId: "",
    editingId: "",
  },
};

// Reducer for the environment state in redux
const handlers = {
  [ReduxActionTypes.FETCH_ENVIRONMENT_INIT]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_ENVIRONMENT_SUCCESS]: (
    state: EnvironmentsReduxState,
    action: ReduxAction<{
      envsData: EnvironmentType[];
      currentEnvData: CurrentEnvironmentDetails;
    }>,
  ): EnvironmentsReduxState => ({
    ...state,
    isLoading: false,
    data: action.payload.envsData,
    currentEnvironmentDetails: action.payload.currentEnvData,
  }),
  [ReduxActionTypes.FETCH_ENVIRONMENT_FAILED]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isLoading: false,
    error: true,
  }),
  [ReduxActionTypes.SET_CURRENT_ENVIRONMENT]: (
    state: EnvironmentsReduxState,
    action: ReduxAction<CurrentEnvironmentDetails>,
  ): EnvironmentsReduxState => ({
    ...state,
    currentEnvironmentDetails: action.payload,
  }),
  [ReduxActionTypes.SET_CURRENT_EDITING_ENVIRONMENT]: (
    state: EnvironmentsReduxState,
    action: ReduxAction<{ currentEditingId: string }>,
  ): EnvironmentsReduxState => ({
    ...state,
    currentEnvironmentDetails: {
      ...state.currentEnvironmentDetails,
      editingId: action.payload.currentEditingId,
    },
  }),
  [ReduxActionTypes.SHOW_ENV_INFO_MODAL]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    showEnvDeployInfoModal: true,
  }),
  [ReduxActionTypes.HIDE_ENV_INFO_MODAL]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    showEnvDeployInfoModal: false,
  }),
};

export default createReducer(initialEnvironmentState, handlers);
