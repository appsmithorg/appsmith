import { type ActionHandlers, createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import type { setApiRightPaneSelectedTab } from "actions/apiPaneActions";

export const initialState: ApiPaneReduxState = {
  isCreating: false,
  isFetching: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  isDirty: {},
  currentCategory: "",
  extraformData: {},
  selectedConfigTabIndex: 0,
  selectedResponseTab: "",
};

export interface ApiPaneReduxState {
  isCreating: boolean; // RR
  isFetching: boolean; // RR
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>; // RN
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  currentCategory: string;
  extraformData: Record<string, any>;
  selectedConfigTabIndex: number;
  selectedResponseTab: string;
  selectedRightPaneTab?: string;
}

export const handlers: ActionHandlers<ApiPaneReduxState> = {
  [ReduxActionTypes.FETCH_ACTIONS_INIT]: (state) => ({
    ...state,
    isFetching: true,
  }),
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (state) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: (state) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionTypes.CREATE_ACTION_INIT]: (state) => ({
    ...state,
    isCreating: true,
  }),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (state) => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (state) => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    state,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state,
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
    state,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    state,
    action: ReduxAction<{ id: string }>,
  ): ApiPaneReduxState => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: (
    state,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => ({
    ...state,
    isDirty: {
      ...state.isDirty,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (
    state,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state,
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
    state,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.DELETE_ACTION_INIT]: (
    state,
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
    state,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),

  [ReduxActionTypes.SET_CURRENT_CATEGORY]: (
    state,
    action: ReduxAction<{ category: string }>,
  ) => ({
    ...state,
    currentCategory: action.payload.category,
  }),
  [ReduxActionTypes.SET_EXTRA_FORMDATA]: (
    state,
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
    state,
    action: ReduxAction<{ selectedTabIndex: number }>,
  ) => {
    const { selectedTabIndex } = action.payload;
    return {
      ...state,
      selectedConfigTabIndex: selectedTabIndex,
    };
  },
  [ReduxActionTypes.SET_API_RIGHT_PANE_SELECTED_TAB]: (
    state,
    action: ReturnType<typeof setApiRightPaneSelectedTab>,
  ) => {
    const { selectedTab } = action.payload;
    return {
      ...state,
      selectedRightPaneTab: selectedTab,
    };
  },
};

const apiPaneReducer = createReducer<ApiPaneReduxState>(initialState, handlers);

export default apiPaneReducer;
