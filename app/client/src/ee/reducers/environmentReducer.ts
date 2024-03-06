import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import type { EnvironmentType } from "@appsmith/configs/types";

export interface CurrentEnvironmentDetails {
  id: string; // current environment id
  name: string; // current environment name
  editorId: string; // editor for which the environment is being set
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
   * @param {boolean} isUpdating - Whether the environments are being updated
   */
  isUpdating: boolean;
  /**
   * @param {boolean} error - Whether there was an error while fetching the environments
   */
  error: boolean;
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
  isUpdating: false,
  error: false,
  data: [],
  currentEnvironmentDetails: {
    id: "",
    name: "",
    editorId: "",
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
  [ReduxActionTypes.CREATE_ENVIRONMENT_INIT]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: true,
  }),
  [ReduxActionTypes.CREATE_ENVIRONMENT_FAILED]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: false,
    error: true,
  }),
  [ReduxActionTypes.CREATE_ENVIRONMENT_SUCCESS]: (
    state: EnvironmentsReduxState,
    action: ReduxAction<EnvironmentType>,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: false,
    data: [...state.data, action.payload],
  }),
  [ReduxActionTypes.UPDATE_ENVIRONMENT_SUCCESS]: (
    state: EnvironmentsReduxState,
    action: ReduxAction<EnvironmentType>,
  ): EnvironmentsReduxState => {
    const updatedEnvironments = state.data.map((environment) => {
      if (environment.id === action.payload.id) {
        return action.payload;
      }
      return environment;
    });
    return {
      ...state,
      isUpdating: false,
      data: updatedEnvironments,
    };
  },
  [ReduxActionTypes.DELETE_ENVIRONMENT_SUCCESS]: (
    state: EnvironmentsReduxState,
    action: ReduxAction<EnvironmentType>,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: false,
    data: state.data.filter(
      (environment) => environment.id !== action.payload.id,
    ),
  }),
  [ReduxActionTypes.UPDATE_ENVIRONMENT_INIT]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: true,
  }),
  [ReduxActionTypes.UPDATE_ENVIRONMENT_FAILED]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: false,
    error: true,
  }),
  [ReduxActionTypes.DELETE_ENVIRONMENT_INIT]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: true,
  }),
  [ReduxActionTypes.DELETE_ENVIRONMENT_FAILED]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isUpdating: false,
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
};

export default createImmerReducer(initialEnvironmentState, handlers);
