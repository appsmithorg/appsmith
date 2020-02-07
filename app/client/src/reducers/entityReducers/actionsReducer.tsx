import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { ActionResponse, RestAction, PaginationField } from "api/ActionAPI";
import { ActionPayload, ExecuteErrorPayload } from "constants/ActionConstants";
import _ from "lodash";

interface ActionData {
  isLoading: boolean;
  config: RestAction;
  data?: ActionResponse;
}
export type ActionDataState = ActionData[];

const initialState: ActionDataState = [];

const actionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction[]>,
  ): ActionDataState =>
    action.payload.map(a => ({
      isLoading: false,
      config: a,
    })),
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: () => initialState,
  [ReduxActionTypes.CREATE_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.concat([{ config: action.payload, isLoading: false }]),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.map(a => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.name === action.payload.name
      ) {
        return { ...a, config: action.payload };
      }
      return a;
    }),
  [ReduxActionTypes.CREATE_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.filter(
      a =>
        a.config.name !== action.payload.name &&
        a.config.pageId !== action.payload.pageId,
    ),
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ data: RestAction }>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.data.id)
        return { ...a, config: action.payload.data };
      return a;
    }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ): ActionDataState => state.filter(a => a.config.id !== action.payload.id),
  [ReduxActionTypes.EXECUTE_ACTION]: (
    state: ActionDataState,
    action: ReduxAction<{
      actions: ActionPayload[];
      paginationField: PaginationField;
    }>,
  ): ActionDataState =>
    state.map(a => {
      if (_.find(action.payload.actions, { actionId: a.config.id })) {
        return {
          ...a,
          isLoading: true,
        };
      }
      return a;
    }),
  [ReduxActionTypes.EXECUTE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ): ActionDataState => {
    const actionId = Object.keys(action.payload)[0];
    return state.map(a => {
      if (a.config.id === actionId) {
        return { ...a, isLoading: false, data: action.payload[actionId] };
      }
      return a;
    });
  },
  [ReduxActionErrorTypes.EXECUTE_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<ExecuteErrorPayload>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.actionId) {
        return { ...a, isLoading: false };
      }
      return a;
    }),
  [ReduxActionTypes.RUN_API_REQUEST]: (
    state: ActionDataState,
    action: ReduxAction<string>,
  ): ActionDataState =>
    state.map(a => {
      if (action.payload === a.config.id) {
        return {
          ...a,
          isLoading: true,
        };
      }
      return a;
    }),
  [ReduxActionTypes.RUN_API_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ): ActionDataState => {
    const actionId = Object.keys(action.payload)[0];
    return state.map(a => {
      if (a.config.id === actionId) {
        return { ...a, isLoading: false, data: action.payload[actionId] };
      }
      return a;
    });
  },
  [ReduxActionErrorTypes.RUN_API_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.id) {
        return { ...a, isLoading: false };
      }
      return a;
    }),
  [ReduxActionTypes.MOVE_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.id) {
        return {
          ...a,
          config: {
            ...a.config,
            name: action.payload.name,
            pageId: action.payload.destinationPageId,
          },
        };
      }
      return a;
    }),
  [ReduxActionTypes.MOVE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.id) {
        return { ...a, config: action.payload };
      }
      return a;
    }),
  [ReduxActionErrorTypes.MOVE_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string; originalPageId: string }>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.id) {
        return {
          ...a,
          config: {
            ...a.config,
            pageId: action.payload.originalPageId,
          },
        };
      }
      return a;
    }),
  [ReduxActionTypes.COPY_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): ActionDataState =>
    state.concat(
      state
        .filter(a => a.config.id === action.payload.id)
        .map(a => ({
          ...a,
          config: {
            ...a.config,
            name: action.payload.name,
            pageId: action.payload.destinationPageId,
          },
        })),
    ),
  [ReduxActionTypes.COPY_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.map(a => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.name === action.payload.name
      ) {
        return {
          ...a,
          config: action.payload,
        };
      }
      return a;
    }),
  [ReduxActionErrorTypes.COPY_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): ActionDataState =>
    state.filter(a => {
      if (a.config.pageId === action.payload.destinationPageId) {
        if (a.config.id === action.payload.id) {
          return a.config.name !== action.payload.name;
        }
        return true;
      }
      return true;
    }),
});

export default actionsReducer;
