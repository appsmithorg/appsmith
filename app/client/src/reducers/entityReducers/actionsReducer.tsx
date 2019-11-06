import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "../../constants/ReduxActionConstants";
import { RestAction } from "../../api/ActionAPI";

const initialState: ActionDataState = {
  data: [],
  isFetching: false,
  isRunning: false,
  isSaving: false,
  isDeleting: false,
};

export interface ActionDataState {
  data: RestAction[];
  isFetching: boolean;
  isRunning: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

const actionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_ACTIONS_INIT]: (state: ActionDataState) => ({
    ...state,
    isFetching: true,
  }),
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction[]>,
  ) => ({
    ...state,
    data: action.payload,
    isFetching: false,
  }),
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: (state: ActionDataState) => ({
    ...state,
    data: [],
    isFetching: false,
  }),
  [ReduxActionTypes.CREATE_ACTION_INIT]: (state: ActionDataState) => ({
    ...state,
    isSaving: true,
  }),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.concat([action.payload]),
    isSaving: false,
  }),
  [ReduxActionTypes.UPDATE_ACTION_INIT]: (state: ActionDataState) => ({
    ...state,
    isSaving: true,
  }),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ data: RestAction }>,
  ) => ({
    ...state,
    data: state.data.map(d => {
      if (d.id === action.payload.data.id) return action.payload.data;
      return d;
    }),
    isSaving: false,
  }),
  [ReduxActionTypes.EXECUTE_ACTION]: (state: ActionDataState) => ({
    ...state,
    isRunning: true,
  }),
  [ReduxActionTypes.EXECUTE_ACTION_SUCCESS]: (state: ActionDataState) => ({
    ...state,
    isRunning: false,
  }),
  [ReduxActionTypes.DELETE_ACTION_INIT]: (state: ActionDataState) => ({
    ...state,
    isDeleting: true,
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    data: state.data.filter(d => d.id !== action.payload.id),
    isDeleting: false,
  }),
});

export default actionsReducer;
