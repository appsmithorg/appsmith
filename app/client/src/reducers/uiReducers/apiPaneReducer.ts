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
  drafts: {},
  isFetching: false,
  isRunning: false,
  isSaving: false,
  isDeleting: false,
};

export interface ApiPaneReduxState {
  lastUsed: string;
  drafts: Record<string, RestAction>;
  isFetching: boolean;
  isRunning: boolean;
  isSaving: boolean;
  isDeleting: boolean;
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
  [ReduxActionTypes.CREATE_ACTION_INIT]: (state: ApiPaneReduxState) => ({
    ...state,
    isSaving: true,
  }),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (state: ApiPaneReduxState) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (state: ApiPaneReduxState) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionTypes.RUN_API_REQUEST]: (state: ApiPaneReduxState) => ({
    ...state,
    isRunning: true,
  }),
  [ReduxActionTypes.RUN_API_SUCCESS]: (state: ApiPaneReduxState) => ({
    ...state,
    isRunning: false,
  }),
  [ReduxActionErrorTypes.RUN_API_ERROR]: (state: ApiPaneReduxState) => ({
    ...state,
    isRunning: false,
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (state: ApiPaneReduxState) => ({
    ...state,
    isSaving: true,
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (state: ApiPaneReduxState) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionErrorTypes.UPDATE_ACTION_ERROR]: (state: ApiPaneReduxState) => ({
    ...state,
    isSaving: false,
  }),
  [ReduxActionTypes.DELETE_ACTION_INIT]: (state: ApiPaneReduxState) => ({
    ...state,
    isDeleting: true,
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (state: ApiPaneReduxState) => ({
    ...state,
    isDeleting: false,
  }),
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: (state: ApiPaneReduxState) => ({
    ...state,
    isDeleting: false,
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
});

export default apiPaneReducer;
