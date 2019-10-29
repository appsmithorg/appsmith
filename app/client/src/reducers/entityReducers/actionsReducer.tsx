import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "../../constants/ReduxActionConstants";
import _ from "lodash";
import { PageAction } from "../../constants/ActionConstants";
import { RestAction } from "../../api/ActionAPI";

const initialState: ActionDataState = {
  list: {},
  data: [],
  isFetching: false,
  isRunning: false,
  isSaving: false,
  isDeleting: false,
};

export interface ActionDataState {
  list: {
    [name: string]: PageAction;
  };
  data: RestAction[];
  isFetching: boolean;
  isRunning: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

const actionsReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_CANVAS_ACTIONS]: (
    state: ActionDataState,
    action: ReduxAction<PageAction[]>,
  ) => {
    const actionMap = _.mapKeys(action.payload, (action: PageAction) => {
      return action.id;
    });
    return { ...state, list: { ...actionMap } };
  },
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
  [ReduxActionTypes.RUN_ACTION_INIT]: (state: ActionDataState) => ({
    ...state,
    isRunning: true,
  }),
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (state: ActionDataState) => ({
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
