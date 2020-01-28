import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { RestAction } from "api/ActionAPI";
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
  [ReduxActionTypes.CREATE_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.concat([action.payload]),
  }),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.map(a => {
      if (
        a.pageId === action.payload.pageId &&
        a.name === action.payload.name
      ) {
        return action.payload;
      }
      return a;
    }),
  }),
  [ReduxActionTypes.CREATE_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.filter(
      a => a.name !== action.payload.name && a.pageId !== action.payload.pageId,
    ),
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
  [ReduxActionTypes.MOVE_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ) => ({
    ...state,
    data: state.data.map(restAction => {
      if (restAction.id === action.payload.id) {
        return {
          ...restAction,
          name: action.payload.name,
          pageId: action.payload.destinationPageId,
        };
      }
      return restAction;
    }),
  }),
  [ReduxActionTypes.MOVE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.map(restAction => {
      if (restAction.id === action.payload.id) {
        return action.payload;
      }
      return restAction;
    }),
  }),
  [ReduxActionErrorTypes.MOVE_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string; originalPageId: string }>,
  ) => ({
    ...state,
    data: state.data.map(restAction => {
      if (restAction.id === action.payload.id) {
        return {
          ...restAction,
          pageId: action.payload.originalPageId,
        };
      }
      return restAction;
    }),
  }),
  [ReduxActionTypes.COPY_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ) => ({
    ...state,
    data: state.data.concat(
      state.data
        .filter(a => a.id === action.payload.id)
        .map(a => ({
          ...a,
          name: action.payload.name,
          pageId: action.payload.destinationPageId,
        })),
    ),
  }),
  [ReduxActionTypes.COPY_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => ({
    ...state,
    data: state.data.map(a => {
      if (
        a.pageId === action.payload.pageId &&
        a.name === action.payload.name
      ) {
        return action.payload;
      }
      return a;
    }),
  }),

  [ReduxActionErrorTypes.COPY_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ) => ({
    ...state,
    data: state.data.filter(a => {
      if (a.pageId === action.payload.destinationPageId) {
        if (a.id === action.payload.id) {
          return a.name !== action.payload.name;
        }
        return true;
      }
      return true;
    }),
  }),
});

export default actionsReducer;
