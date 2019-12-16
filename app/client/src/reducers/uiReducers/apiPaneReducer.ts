import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { RestAction } from "api/ActionAPI";
import _ from "lodash";

const initialState: ApiPaneReduxState = {
  lastUsed: "",
  isFetching: false,
  drafts: {},
  isRunning: {},
  isSaving: {},
  isDeleting: {},
};

export interface ApiPaneReduxState {
  lastUsed: string;
  isFetching: boolean;
  drafts: Record<string, RestAction>;
  isRunning: Record<string, boolean>;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
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
    action: ReduxAction<string>,
  ) => ({
    ...state,
    isRunning: {
      ...state.isRunning,
      [action.payload]: true,
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
  [ReduxActionTypes.UPDATE_API_DRAFT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string; draft: Partial<RestAction> }>,
  ) => ({
    ...state,
    drafts: {
      ...state.drafts,
      [action.payload.id]: action.payload.draft,
    },
  }),
  [ReduxActionTypes.DELETE_API_DRAFT]: (
    state: ApiPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    drafts: _.omit(state.drafts, action.payload.id),
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
});

export default apiPaneReducer;
