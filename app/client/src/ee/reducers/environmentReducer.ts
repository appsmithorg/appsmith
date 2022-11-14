import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

// Type for one environment variable
export interface EnvironmentVariable {
  id: string;
  name: string;
  value: string;
}

// Type for one environment
export interface EnvironmentType {
  id: string;
  name: string;
  environmentVariablesList: EnvironmentVariable[];
}

// Type for the environment state in redux
export interface EnvironmentsReduxState {
  /**
   * @param {boolean} isLoading - Whether the environments are being fetched
   */
  isLoading: boolean;
  /**
   * @param {EnvironmentType} data - The list of environments
   */
  data: EnvironmentType[];
}

// Initial state of the environment state in redux
export const initailEnvironmentsState: EnvironmentsReduxState = {
  isLoading: true,
  data: [],
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
    action: ReduxAction<EnvironmentType[]>,
  ): EnvironmentsReduxState => ({
    ...state,
    isLoading: false,
    data: action.payload,
  }),
  [ReduxActionTypes.FETCH_ENVIRONMENT_FAILED]: (
    state: EnvironmentsReduxState,
  ): EnvironmentsReduxState => ({
    ...state,
    isLoading: false,
  }),
};

export default createReducer(initailEnvironmentsState, handlers);
