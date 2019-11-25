import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

const initialState: ApiPaneReduxState = {
  isFetching: false,
  isRunning: false,
  isSaving: false,
  isDeleting: false,
};

export interface ApiPaneReduxState {
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
});

export default apiPaneReducer;
