import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { omit } from "lodash";
import type { Action } from "entities/Action";
import type { ActionResponse } from "api/ActionAPI";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";

export const initialState: QueryPaneReduxState = {
  isFetching: false,
  isCreating: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  runErrorMessage: {},
  lastUsed: "", // NR
  responseTabHeight: ActionExecutionResizerHeight,
  selectedConfigTabIndex: "0",
};

export interface QueryPaneReduxState {
  isFetching: boolean; // RR
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>; // RR
  isDeleting: Record<string, boolean>;
  runErrorMessage: Record<string, string>;
  lastUsed: string; // NR
  isCreating: boolean; // RR
  selectedConfigTabIndex: string;
  responseTabHeight: number;
}

export const handlers = {
  [ReduxActionTypes.CREATE_ACTION_INIT]: (state: QueryPaneReduxState) => {
    return {
      ...state,
      isCreating: true,
    };
  },
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (state: QueryPaneReduxState) => {
    return {
      ...state,
      isCreating: false,
    };
  },
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (state: QueryPaneReduxState) => {
    return {
      ...state,
      isCreating: false,
    };
  },
  [ReduxActionTypes.QUERY_PANE_CHANGE]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    lastUsed: action.payload.id,
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ data: Action }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_ACTION_ERROR]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_INIT]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    state: any,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [action.payload.id]: true,
      },
    };
  },

  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    state: any,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [action.payload.id]: false,
      },
    };
  },

  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state: any,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => {
    const actionId = Object.keys(action.payload)[0];
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [actionId]: false,
      },
      runErrorMessage: omit(state.runErrorMessage, [actionId]),
    };
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    state: any,
    action: ReduxAction<{ id: string; error: Error }>,
  ) => {
    const { error, id } = action.payload;

    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [id]: false,
      },
      runErrorMessage: {
        ...state.runError,
        [id]: error.message,
      },
    };
  },
  [ReduxActionTypes.SET_QUERY_PANE_CONFIG_SELECTED_TAB]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ selectedTabIndex: number }>,
  ) => {
    const { selectedTabIndex } = action.payload;
    return {
      ...state,
      selectedConfigTabIndex: selectedTabIndex,
    };
  },
};

const queryPaneReducer = createReducer(initialState, handlers);

export default queryPaneReducer;
