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
  response: {
    body: null,
    headers: null,
    statusCode: "",
  },
  loading: false,
};

export interface ActionDataState {
  list: {
    [name: string]: PageAction;
  };
  data: RestAction[];
  response: {
    body: any;
    headers: any;
    statusCode: string;
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
  [ReduxActionTypes.FETCH_ACTIONS_INIT]: (state: ActionDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction[]>,
  ) => {
    return { ...state, data: action.payload, loading: false };
  },
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: (state: ActionDataState) => {
    return { ...state, data: [], loading: false };
  },
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<any>,
  ) => {
    return { ...state, response: action.payload };
  },
});

export default actionsReducer;
