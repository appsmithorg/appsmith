import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { ActionResponse } from "api/ActionAPI";
import type { ExecuteErrorPayload } from "constants/AppsmithActionConstants/ActionConstants";
import _ from "lodash";
import type { Action } from "entities/Action";
import type {
  ExecutePluginActionSuccessPayload,
  UpdateActionPropertyActionPayload,
} from "actions/pluginActionActions";
import { klona } from "klona";

export interface ActionData {
  isLoading: boolean;
  config: Action;
  data?: ActionResponse;
}

export interface ActionDataWithMeta extends ActionData {
  responseMeta: {
    headers?: unknown;
    isExecutionSuccess: boolean;
    statusCode?: string;
  };
}

export type ActionDataState = ActionData[];

export interface PartialActionData {
  isLoading: boolean;
  config: { id: string; baseId: string };
  data?: ActionResponse;
}

const initialState: ActionDataState = [];

export const handlers = {
  [ReduxActionTypes.FETCH_ACTIONS_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action[]>,
  ) => {
    return action.payload.map((action) => {
      const foundAction = draftMetaState.find((currentAction) => {
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
    _: ActionDataState,
    action: ReduxAction<Action[]>,
  ) => {
    return action.payload.map((a) => ({
      isLoading: false,
      config: a,
    }));
  },
  [ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action[]>,
  ) => {
    if (action.payload.length > 0) {
      const stateActionMap = _.keyBy(draftMetaState, "config.id");
      const result: ActionDataState = [];

      action.payload.forEach((actionPayload: Action) => {
        const stateAction = stateActionMap[actionPayload.id];

        if (stateAction) {
          result.push({
            data: stateAction.data,
            isLoading: false,
            config: actionPayload,
          });

          delete stateActionMap[actionPayload.id];
        } else {
          result.push({
            isLoading: false,
            config: actionPayload,
          });
        }
      });

      Object.keys(stateActionMap).forEach((stateActionKey) => {
        result.push(stateActionMap[stateActionKey]);
      });

      return result;
    }
  },
  [ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action>,
  ) => {
    return draftMetaState.concat([
      { config: action.payload, isLoading: false },
    ]);
  },
  [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR]: () => initialState,
  [ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR]: () => initialState,
  [ReduxActionTypes.CREATE_ACTION_INIT]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action>,
  ) => {
    return draftMetaState.concat([
      {
        config: {
          ...action.payload,
          baseId: action.payload.name,
          id: action.payload.name,
        },
        isLoading: true,
      },
    ]);
  },
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action>,
  ) => {
    draftMetaState.forEach((a) => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.id === action.payload.name
      ) {
        a.config = action.payload;
        a.isLoading = false;
      }
    });
  },
  [ReduxActionErrorTypes.CREATE_ACTION_ERROR]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action>,
  ) => {
    return draftMetaState.filter(
      (a) =>
        a.config.name !== action.payload.name &&
        a.config.id !== action.payload.name,
    );
  },
  [ReduxActionTypes.UPDATE_ACTION_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ data: Action }>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.data.id) {
        a.config = action.payload.data;
      }
    });
  },
  [ReduxActionTypes.APPEND_ACTION_AFTER_BUILDING_BLOCK_DROP]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ data: Action }>,
  ) => {
    return [...draftMetaState, action.payload.data];
  },
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.id) {
        return _.set(a, `config.${action.payload.field}`, action.payload.value);
      }
    });
  },
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return draftMetaState.filter((a) => a.config.id !== action.payload.id);
  },
  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = true;
      }
    });
  },
  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS]: (
    draftMetaState: Array<ActionData | PartialActionData>,
    action: ReduxAction<ExecutePluginActionSuccessPayload>,
  ) => {
    if (!action.payload.isActionCreatedInApp) return;

    const foundAction = draftMetaState.find((stateAction) => {
      return stateAction.config.id === action.payload.id;
    });

    if (foundAction) {
      foundAction.isLoading = false;
      foundAction.data = action.payload.response;
    } else {
      const partialAction: PartialActionData = {
        isLoading: false,
        config: { id: action.payload.id, baseId: action.payload.baseId },
        data: action.payload.response,
      };

      draftMetaState.push(partialAction);
    }
  },
  [ReduxActionTypes.SET_ACTION_RESPONSE_DISPLAY_FORMAT]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.id) {
        return _.set(a, `data.${action.payload.field}`, action.payload.value);
      }
    });
  },
  [ReduxActionTypes.CLEAR_ACTION_RESPONSE]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ actionId: string }>,
  ) => {
    draftMetaState.forEach((stateAction) => {
      if (stateAction.config.id === action.payload.actionId) {
        stateAction.data = undefined;
      }
    });
  },
  [ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<ExecuteErrorPayload>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.actionId) {
        a.isLoading = false;
        a.data = action.payload.data;
      }
    });
  },

  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.forEach((a) => {
      if (action.payload.id === a.config.id) {
        a.isLoading = true;
      }
    });
  },
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => {
    const actionId = Object.keys(action.payload)[0];

    draftMetaState.forEach((a) => {
      if (a.config.id === actionId) {
        a.isLoading = false;

        if (a.data) _.assign(a.data, action.payload[actionId]);
        else a.data = action.payload[actionId];
      }
    });
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });
  },
  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });
  },
  [ReduxActionTypes.MOVE_ACTION_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action>,
  ) => {
    draftMetaState.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.config = action.payload;
      }
    });
  },
  [ReduxActionTypes.COPY_ACTION_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action>,
  ) => {
    return draftMetaState.concat([
      {
        config: { ...action.payload },
        isLoading: false,
      },
    ]);
  },
  [ReduxActionTypes.SET_ACTION_TO_EXECUTE_ON_PAGELOAD]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<
      Array<{
        executeOnLoad: boolean;
        id: string;
        name: string;
      }>
    >,
  ) => {
    const actionUpdateSearch = _.keyBy(action.payload, "id");

    draftMetaState.forEach((action) => {
      if (action.config.id in actionUpdateSearch) {
        action.config.executeOnLoad =
          actionUpdateSearch[action.config.id].executeOnLoad;
      }
    });
  },

  [ReduxActionTypes.SWITCH_CURRENT_PAGE_ID]: (
    draftMetaState: ActionDataState,
  ) => {
    draftMetaState.forEach((a) => {
      a.data = undefined;
    });
  },

  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
};

const actionsReducer = createImmerReducer(initialState, handlers);

export default actionsReducer;
