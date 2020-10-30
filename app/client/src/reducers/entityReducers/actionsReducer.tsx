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
import produce from "immer";
import { Datasource } from "api/DatasourcesApi";

export interface ActionData {
  isLoading: boolean;
  config: RestAction | RapidApiAction;
  data?: ActionResponse;
}
export type ActionDataState = ActionData[];
export interface PartialActionData {
  isLoading: boolean;
  config: Partial<RestAction | RapidApiAction>;
  data?: ActionResponse;
}

const initialState: ActionDataState = [];

const actionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction[]>,
  ): ActionDataState => {
    return action.payload.map(action => {
      const foundAction = state.find(currentAction => {
        return currentAction.config.id === action.id;
      });
      return {
        isLoading: false,
        config: action,
        data: foundAction?.data,
      };
    });
  },
  [ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS]: (
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
  [ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<RestAction>,
  ) => state.concat([{ config: action.payload, isLoading: false }]),
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: () => initialState,
  [ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR]: () => initialState,
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
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ data: RestAction }>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.data.id)
        return { ...a, config: action.payload.data };
      return a;
    }),
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
  ): PartialActionData[] => {
    const foundAction = state.find(stateAction => {
      return stateAction.config.id === action.payload.id;
    });
    if (foundAction) {
      return state.map(stateAction => {
        if (stateAction.config.id === action.payload.id) {
          return {
            ...stateAction,
            isLoading: false,
            data: action.payload.response,
          };
        }
        return stateAction;
      });
    } else {
      const partialAction: PartialActionData = {
        isLoading: false,
        config: { id: action.payload.id },
        data: action.payload.response,
      };
      return [...state, partialAction];
    }
  },
  [ReduxActionErrorTypes.EXECUTE_ACTION_ERROR]: (
    state: ActionDataState,
    action: ReduxAction<ExecuteErrorPayload>,
  ): ActionDataState =>
    state.map(a => {
      if (a.config.id === action.payload.actionId) {
        return { ...a, isLoading: false, data: action.payload.error };
      }

      return a;
    }),
  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ): ActionDataState =>
    state.map(a => {
      if (action.payload.id === a.config.id) {
        return {
          ...a,
          isLoading: true,
        };
      }

      return a;
    }),
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
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
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
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
            id: "TEMP_COPY_ID",
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
  [ReduxActionTypes.SET_ACTION_TO_EXECUTE_ON_PAGELOAD]: (
    state: ActionDataState,
    actionIds: ReduxAction<string[]>,
  ) => {
    return produce(state, draft => {
      draft.forEach((action, index) => {
        if (actionIds.payload.indexOf(action.config.id) > -1) {
          draft[index].config.executeOnLoad = true;
        }
      });
    });
  },
  [ReduxActionTypes.FETCH_DATASOURCES_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<Datasource[]>,
  ) => {
    const datasources = action.payload;

    return state.map(action => {
      const datasourceId = action.config.datasource.id;
      if (datasourceId) {
        const datasource = datasources.find(
          datasource => datasource.id === datasourceId,
        );

        return {
          ...action,
          config: {
            ...action.config,
            datasource: datasource,
          },
        };
      }

      return action;
    });
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<Datasource>,
  ) => {
    const datasource = action.payload;

    return state.map(action => {
      const datasourceId = action.config.datasource.id;
      if (datasourceId && datasource.id === datasourceId) {
        return {
          ...action,
          config: {
            ...action.config,
            datasource: datasource,
          },
        };
      }

      return action;
    });
  },
});

export default actionsReducer;
