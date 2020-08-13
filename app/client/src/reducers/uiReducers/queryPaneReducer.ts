import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import _ from "lodash";
import { RestAction } from "entities/Action";
import { ActionResponse } from "api/ActionAPI";

const initialState: QueryPaneReduxState = {
  isFetching: false,
  isCreating: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  runQuerySuccessData: {},
  runErrorMessage: {},
  lastUsed: "", // NR
};

export interface QueryPaneReduxState {
  isFetching: boolean; // RR
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>; // RR
  isDeleting: Record<string, boolean>;
  runQuerySuccessData: {};
  runErrorMessage: Record<string, string>;
  lastUsed: string; // NR
  isCreating: boolean; // RR
}

const queryPaneReducer = createReducer(initialState, {
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
    action: ReduxAction<{ data: RestAction }>,
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
      runQuerySuccessData: [],
    };
  },
  [ReduxActionTypes.CLEAR_PREVIOUSLY_EXECUTED_QUERY]: (state: any) => ({
    ...state,
    runQuerySuccessData: [],
  }),

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
      runQuerySuccessData: {
        ...state.runQuerySuccessData,
        ...action.payload,
      },
      runErrorMessage: _.omit(state.runErrorMessage, [actionId]),
    };
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    state: any,
    action: ReduxAction<{ id: string; error: Error }>,
  ) => {
    const { id, error } = action.payload;

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
});

export default queryPaneReducer;
