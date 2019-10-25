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
  responses: {},
  loading: false,
};

export interface ActionApiResponse {
  body: JSON;
  headers: any;
  statusCode: string;
  timeTaken: number;
  size: number;
}

export interface ActionDataState {
  list: {
    [name: string]: PageAction;
  };
  data: RestAction[];
  responses: {
    [id: string]: ActionApiResponse;
  };
  loading: boolean;
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
    loading: true,
  }),
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction[]>,
  ) => ({
    ...state,
    data: action.payload,
    loading: false,
  }),
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: (state: ActionDataState) => ({
    ...state,
    data: [],
    loading: false,
  }),
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionApiResponse }>,
  ) => ({ ...state, responses: { ...state.responses, ...action.payload } }),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.concat([action.payload]),
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
  }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    data: state.data.filter(d => d.id !== action.payload.id),
  }),
});

export default actionsReducer;
