import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { ActionResponse } from "api/ActionAPI";
import { ExecuteErrorPayload } from "constants/ActionConstants";
import _ from "lodash";
import { RapidApiAction, RestAction } from "entities/Action";
import { UpdateActionPropertyActionPayload } from "actions/actionActions";
export interface ActionData {
  isLoading: boolean;
  config: RestAction | RapidApiAction;
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
  [ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction[]>,
  ): ActionDataState => {
    if (action.payload.length > 0) {
      const payloadActionMap = _.keyBy(action.payload, "id");
      return state.map((stateAction: ActionData) => {
        if (stateAction.config.pageId === action.payload[0].pageId) {
          return {
            data: stateAction.data,
            isLoading: false,
            config: payloadActionMap[stateAction.config.id],
          };
        }
        return stateAction;
      });
    }
    return state;
  },
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: () => initialState,
  [ReduxActionTypes.CREATE_ACTION_INIT]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.concat([
      {
        config: { ...action.payload, id: action.payload.name },
        isLoading: false,
      },
    ]),
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ): ActionDataState =>
    state.map(a => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.id === action.payload.name
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
        a.config.id !== action.payload.name,
    ),
  // [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
  //   state: ActionDataState,
  //   action: ReduxAction<{ data: RestAction }>,
  // ): ActionDataState =>
  //   state.map(a => {
  //     if (a.config.id === action.payload.data.id)
  //       return { ...a, config: action.payload.data };
  //     return a;
  //   }),
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: (
    state: ActionDataState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) =>
    state.map(a => {
      if (a.config.id === action.payload.id) {
        return _.set(a, `config.${action.payload.field}`, action.payload.value);
      }
      return a;
    }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ): ActionDataState => state.filter(a => a.config.id !== action.payload.id),
  [ReduxActionTypes.DELETE_QUERY_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ): ActionDataState => state.filter(a => a.config.id !== action.payload.id),
  [ReduxActionTypes.EXECUTE_API_ACTION_REQUEST]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.id) {
        return {
          ...a,
          isLoading: true,
        };
      }
      return a;
    }),
  [ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string; response: ActionResponse }>,
  ): ActionDataState => {
    return state.map(a => {
      if (a.config.id === action.payload.id) {
        return { ...a, isLoading: false, data: action.payload.response };
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
  [ReduxActionTypes.RUN_QUERY_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ actionId: string; data: ActionResponse }>,
  ): ActionDataState => {
    const actionId: string = action.payload.actionId;

    return state.map(a => {
      if (a.config.id === actionId) {
        return { ...a, isLoading: false, data: action.payload.data };
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
