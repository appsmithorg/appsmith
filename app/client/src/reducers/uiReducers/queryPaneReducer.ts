import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import _ from "lodash";
import { RestAction } from "entities/Action";

const initialState: QueryPaneReduxState = {
  isFetching: false,
  isCreating: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  runQuerySuccessData: {},
  runErrorMessage: {},
  lastUsed: "",
};

export interface QueryPaneReduxState {
  isFetching: boolean;
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  runQuerySuccessData: {};
  runErrorMessage: Record<string, string>;
  lastUsed: string;
  isCreating: boolean;
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
    action: ReduxAction<{ data: RestAction }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: true,
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
  [ReduxActionTypes.DELETE_QUERY_INIT]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.DELETE_QUERY_SUCCESS]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.DELETE_QUERY_ERROR]: (
    state: QueryPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.EXECUTE_QUERY_REQUEST]: (
    state: any,
    action: ReduxAction<{ action: RestAction; actionId: string }>,
  ) => {
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [action.payload.actionId]: true,
      },
      runQuerySuccessData: [],
    };
  },
  [ReduxActionTypes.CLEAR_PREVIOUSLY_EXECUTED_QUERY]: (state: any) => ({
    ...state,
    runQuerySuccessData: [],
  }),

  [ReduxActionTypes.RUN_QUERY_SUCCESS]: (
    state: any,
    action: ReduxAction<{ actionId: string; data: object }>,
  ) => {
    const { actionId } = action.payload;

    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [action.payload.actionId]: false,
      },
      runQuerySuccessData: {
        ...state.runQuerySuccessData,
        [action.payload.actionId]: action.payload.data,
      },
      runErrorMessage: _.omit(state.runErrorMessage, [actionId]),
    };
  },
  [ReduxActionErrorTypes.RUN_QUERY_ERROR]: (
    state: any,
    action: ReduxAction<{ actionId: string; message: string }>,
  ) => {
    const { actionId, message } = action.payload;

    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [actionId]: false,
      },
      runErrorMessage: {
        ...state.runError,
        [actionId]: message,
      },
    };
  },
});

export default queryPaneReducer;
