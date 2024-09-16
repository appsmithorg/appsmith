import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";

export const initialState: ApiPaneReduxState = {
  isCreating: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  isDirty: {},
  extraformData: {},
  selectedConfigTabIndex: 0,
  debugger: {
    open: false,
    responseTabHeight: ActionExecutionResizerHeight,
  },
};

export interface ApiPaneDebuggerState {
  open: boolean;
  responseTabHeight: number;
  selectedTab?: string;
}

export interface ApiPaneReduxState {
  isCreating: boolean; // RR
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>; // RN
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraformData: Record<string, any>;
  selectedConfigTabIndex: number;
  selectedRightPaneTab?: string;
  debugger: ApiPaneDebuggerState;
}

export const handlers = {
  [ReduxActionTypes.FETCH_ACTIONS_INIT]: (state: ApiPaneReduxState) => ({
    ...state,
    isFetching: true,
  }),
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (state: ApiPaneReduxState) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: (state: ApiPaneReduxState) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionTypes.CREATE_ACTION_INIT]: (
    state: ApiPaneReduxState,
  ): ApiPaneReduxState => ({
    ...state,
    isCreating: true,
  }),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: ApiPaneReduxState,
  ): ApiPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (
    state: ApiPaneReduxState,
  ): ApiPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: true,
    },
    debugger: {
      ...state.debugger,
      open: true,
    },
  }),
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state: ApiPaneReduxState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<{ [id: string]: any }>,
  ) => {
    const actionId = Object.keys(action.payload)[0];
    return {
      ...state,
      isRunning: {
        ...state.isRunning,
        [actionId]: false,
      },
    };
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ): ApiPaneReduxState => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: (
    state: ApiPaneReduxState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => ({
    ...state,
    isDirty: {
      ...state.isDirty,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ data: Action }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
    isDirty: {
      ...state.isDirty,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_ACTION_ERROR]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_INIT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),

  /**
   * This redux action sets the extraformData field for an action. This is used to select the
   * appropriate body type tab selection in the Rest API plugin based on the content-type.
   * This redux action can be extended to other functionalities as well in the future.
   *
   * @param {ApiPaneReduxState} state
   * @param {ReduxAction} action
   * @returns {ApiPaneReduxState}
   */
  [ReduxActionTypes.SET_EXTRA_FORMDATA]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string; values: Record<string, unknown> }>,
  ) => {
    const { id, values } = action.payload;
    return {
      ...state,
      extraformData: {
        ...state.extraformData,
        [id]: values,
      },
    };
  },
  [ReduxActionTypes.SET_API_PANE_CONFIG_SELECTED_TAB]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ selectedTabIndex: number }>,
  ) => {
    const { selectedTabIndex } = action.payload;
    return {
      ...state,
      selectedConfigTabIndex: selectedTabIndex,
    };
  },
  [ReduxActionTypes.SET_API_RIGHT_PANE_SELECTED_TAB]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ selectedTab: number }>,
  ) => {
    const { selectedTab } = action.payload;
    return {
      ...state,
      selectedRightPaneTab: selectedTab,
    };
  },
  [ReduxActionTypes.SET_API_PANE_DEBUGGER_STATE]: (
    state: ApiPaneReduxState,
    action: ReduxAction<Partial<ApiPaneDebuggerState>>,
  ) => {
    return {
      ...state,
      debugger: {
        ...state.debugger,
        ...action.payload,
      },
    };
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: ApiPaneReduxState) => {
    return {
      ...state,
      isSaving: {},
    };
  },
};

const apiPaneReducer = createReducer(initialState, handlers);

export default apiPaneReducer;
