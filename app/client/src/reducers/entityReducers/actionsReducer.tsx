import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "../../constants/ReduxActionConstants";
import { RestAction } from "../../api/ActionAPI";
import { ActionWidgetIdsMap } from "sagas/ActionWidgetMapSagas";

const initialState: ActionDataState = {
  data: [],
  actionToWidgetIdMap: {},
};

export interface ActionDataState {
  data: RestAction[];
  actionToWidgetIdMap: ActionWidgetIdsMap;
}

const actionsReducer = createReducer(initialState, {
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
  }),
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
  [ReduxActionTypes.CREATE_UPDATE_ACTION_WIDGETIDS_MAP_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<ActionWidgetIdsMap>,
  ) => ({
    ...state,
    actionToWidgetIdMap: action.payload,
  }),
});

export default actionsReducer;
