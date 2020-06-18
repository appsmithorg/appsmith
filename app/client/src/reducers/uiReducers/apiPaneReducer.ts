import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { RestAction } from "entities/Action";

const initialState: ApiPaneReduxState = {
  lastUsed: "",
  isFetching: false,
  isRunning: {},
  isSaving: {},
  isDeleting: {},
  currentCategory: "",
  lastUsedEditorPage: "",
  lastSelectedPage: "",
  extraformData: {},
  datasourceFieldText: {},
};

export interface ApiPaneReduxState {
  lastUsed: string;
  isFetching: boolean;
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  currentCategory: string;
  lastUsedEditorPage: string;
  datasourceFieldText: Record<string, string>;
  lastSelectedPage: string;
  extraformData: Record<string, any>;
}

const apiPaneReducer = createReducer(initialState, {
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
  [ReduxActionTypes.RUN_API_REQUEST]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.RUN_API_SUCCESS]: (
    state: ApiPaneReduxState,
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
  [ReduxActionErrorTypes.RUN_API_ERROR]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ data: RestAction }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ data: RestAction }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
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
  [ReduxActionTypes.API_PANE_CHANGE_API]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    lastUsed: action.payload.id,
  }),
  [ReduxActionTypes.FETCH_PAGE_SUCCESS]: (state: ApiPaneReduxState) => ({
    ...state,
    lastUsed: "",
  }),
  [ReduxActionTypes.SET_CURRENT_CATEGORY]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ category: string }>,
  ) => ({
    ...state,
    currentCategory: action.payload.category,
  }),
  [ReduxActionTypes.SET_LAST_USED_EDITOR_PAGE]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ path: string }>,
  ) => ({
    ...state,
    lastUsedEditorPage: action.payload.path,
  }),
  [ReduxActionTypes.SET_LAST_SELECTED_PAGE_PAGE]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ selectedPageId: string }>,
  ) => ({
    ...state,
    lastSelectedPage: action.payload.selectedPageId,
  }),
  [ReduxActionTypes.SET_EXTRA_FORMDATA]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string; values: {} }>,
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
  [ReduxActionTypes.SET_DATASOURCE_FIELD_TEXT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ apiId: string; value: string }>,
  ) => {
    const { apiId } = action.payload;
    return {
      ...state,
      datasourceFieldText: {
        ...state.datasourceFieldText,
        [apiId]: action.payload.value,
      },
    };
  },
});

export default apiPaneReducer;
