import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { ActionData } from "./actionsReducer";
import type {
  BatchedJSExecutionData,
  BatchedJSExecutionErrors,
  JSCollectionData,
} from "@appsmith/reducers/entityReducers/jsActionsReducer";
import type { ActionResponse } from "api/ActionAPI";
import type { ExecuteErrorPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { assign, set, unset } from "lodash";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import type {
  ConvertEntityToInstanceResponse,
  CreateModuleInstanceResponse,
  FetchModuleInstanceEntitiesResponse,
} from "@appsmith/api/ModuleInstanceApi";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { SavePageResponse } from "api/PageApi";
import { klona } from "klona";

type UpdateModuleInstanceSettingsResponse = JSCollection | Action;

export interface ModuleInstanceEntitiesReducerState {
  actions: ActionData[];
  jsCollections: JSCollectionData[];
}

export const initialState: ModuleInstanceEntitiesReducerState = {
  actions: [],
  jsCollections: [],
};

export const handlers = {
  [ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<FetchModuleInstanceEntitiesResponse>,
  ) => {
    const actions = action.payload.actions.map((action) => {
      const previousAction = draftState.actions.find(
        (draftAction) => draftAction.config.id === action.id,
      );
      return {
        isLoading: false,
        config: action,
        data: previousAction?.data || undefined,
      };
    });
    const jsCollections = action.payload.jsCollections.map((jsCollection) => {
      const previousJSCollection = draftState.jsCollections.find(
        (draftJSaction) => draftJSaction.config.id === jsCollection.id,
      );
      return {
        isLoading: false,
        config: jsCollection,
        data: previousJSCollection?.data || undefined,
      };
    });

    draftState.actions = actions;
    draftState.jsCollections = jsCollections;
  },
  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<UpdateModuleInstanceSettingsResponse>,
  ) => {
    const actionIndex = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (actionIndex !== -1) {
      draftState.actions[actionIndex].config = action.payload as Action;
      return draftState;
    }

    const jsCollectionIndex = draftState.jsCollections.findIndex(
      (a) => a.config.id === action.payload.id,
    );
    if (jsCollectionIndex !== -1) {
      draftState.jsCollections[jsCollectionIndex].config =
        action.payload as JSCollection;
    }
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<UpdateModuleInstanceSettingsResponse>,
  ) => {
    const actionIndex = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (actionIndex !== -1) {
      draftState.actions[actionIndex].config = action.payload as Action;
      return draftState;
    }

    const jsCollectionIndex = draftState.jsCollections.findIndex(
      (a) => a.config.id === action.payload.id,
    );
    if (jsCollectionIndex !== -1) {
      draftState.jsCollections[jsCollectionIndex].config =
        action.payload as JSCollection;
    }
  },

  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (action.payload.id === a.config.id) {
        a.isLoading = true;
      }
    });

    return draftState;
  },

  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    const index = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (index !== -1) {
      draftState.actions[index].isLoading = false;
    }

    return draftState;
  },

  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });

    return draftState;
  },

  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => {
    const actionId = Object.keys(action.payload)[0];
    draftState.actions.forEach((a) => {
      if (a.config.id === actionId) {
        a.isLoading = false;
        if (a.data) assign(a.data, action.payload[actionId]);
        else a.data = action.payload[actionId];
      }
    });
  },

  [ReduxActionTypes.SET_ACTION_RESPONSE_DISPLAY_FORMAT]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<UpdateActionPropertyActionPayload>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        return set(a, `data.${action.payload.field}`, action.payload.value);
      }
    });
  },

  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string; response: ActionResponse }>,
  ) => {
    const foundAction = draftState.actions.find((stateAction) => {
      return stateAction.config.id === action.payload.id;
    });

    if (foundAction) {
      foundAction.isLoading = false;
      foundAction.data = action.payload.response;
    }
  },

  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = true;
      }
    });
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<Action>,
  ) => {
    draftState.actions = draftState.actions.filter(
      (a) => a.config.moduleInstanceId !== action.payload.id,
    );
    draftState.jsCollections = draftState.jsCollections.filter(
      (a) => a.config.id === action.payload.id,
    );
  },

  [ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<CreateModuleInstanceResponse>,
  ) => {
    const { entities } = action.payload;
    entities.actions.forEach((action) => {
      draftState.actions.push({
        isLoading: false,
        config: action,
        data: undefined,
      });
    });
    entities.jsCollections.forEach((jsCollection) => {
      draftState.jsCollections.push({
        isLoading: false,
        config: jsCollection,
        data: undefined,
      });
    });
    return draftState;
  },
  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = true;
      }
    });
  },
  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string; response: ActionResponse }>,
  ) => {
    const foundAction = draftState.actions.find((stateAction) => {
      return stateAction.config.id === action.payload.id;
    });
    if (foundAction) {
      foundAction.isLoading = false;
      foundAction.data = action.payload.response;
    }
  },
  [ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<ExecuteErrorPayload>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.actionId) {
        a.isLoading = false;
        a.data = action.payload.data;
      }
    });
  },

  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (action.payload.id === a.config.id) {
        a.isLoading = true;
      }
    });
  },
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => {
    const actionId = Object.keys(action.payload)[0];
    draftState.actions.forEach((a) => {
      if (a.config.id === actionId) {
        a.isLoading = false;
        if (a.data) assign(a.data, action.payload[actionId]);
        else a.data = action.payload[actionId];
      }
    });
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });
  },
  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });
  },

  [ReduxActionTypes.EXECUTE_JS_FUNCTION_INIT]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{
      collectionName: string;
      collectionId: string;
      action: JSAction;
    }>,
  ) => {
    draftState.jsCollections = draftState.jsCollections.map((jsCollection) => {
      if (jsCollection.config.id === action.payload.collectionId) {
        const newData = { ...jsCollection.data };
        const newIsDirty = { ...jsCollection.isDirty };
        unset(newData, action.payload.action.id);
        unset(newIsDirty, action.payload.action.id);
        return {
          ...jsCollection,
          isExecuting: {
            ...jsCollection.isExecuting,
            [action.payload.action.id]: true,
          },
          data: {
            ...newData,
          },
          isDirty: {
            ...newIsDirty,
          },
        };
      }
      return jsCollection;
    });
  },

  [ReduxActionTypes.SET_MODULE_INSTANCE_ACTIVE_JS_ACTION]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{
      jsCollectionId: string;
      jsActionId: string;
    }>,
  ) => {
    draftState.jsCollections.forEach((jsCollection) => {
      if (jsCollection.config.id === action.payload.jsCollectionId) {
        jsCollection.activeJSActionId = action.payload.jsActionId;
      }
    });
  },

  [ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{
      collectionId: string;
      actionId: string;
      isDirty: boolean;
    }>,
  ) => {
    draftState.jsCollections = draftState.jsCollections.map((jsCollection) => {
      if (jsCollection.config.id === action.payload.collectionId) {
        return {
          ...jsCollection,
          isExecuting: {
            ...jsCollection.isExecuting,
            [action.payload.actionId]: false,
          },
          isDirty: {
            ...jsCollection.isDirty,
            [action.payload.actionId]: action.payload.isDirty,
          },
        };
      }
      return jsCollection;
    });
  },
  [ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_DATA]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<BatchedJSExecutionData>,
  ) => {
    draftState.jsCollections = draftState.jsCollections.map((jsCollection) => {
      const collectionId = jsCollection.config.id;
      if (action.payload.hasOwnProperty(collectionId)) {
        let data = {
          ...jsCollection.data,
        };
        action.payload[collectionId].forEach((item) => {
          data = { ...data, [item.actionId]: item.data };
        });
        return {
          ...jsCollection,
          data,
        };
      }
      return jsCollection;
    });
  },

  [ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_ERRORS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<BatchedJSExecutionErrors>,
  ) => {
    draftState.jsCollections = draftState.jsCollections.map((jsCollection) => {
      const collectionId = jsCollection.config.id;
      if (action.payload.hasOwnProperty(collectionId)) {
        let isDirty = {
          ...jsCollection.isDirty,
        };
        action.payload[collectionId].forEach(({ actionId }) => {
          isDirty = { ...isDirty, [actionId]: true };
        });
        return {
          ...jsCollection,
          isDirty,
        };
      }
      return jsCollection;
    });
  },

  [ReduxActionTypes.SAVE_PAGE_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<SavePageResponse>,
  ) => {
    const actionUpdates = action.payload?.data?.actionUpdates || [];

    actionUpdates.forEach((actionUpdates) => {
      draftState.actions.forEach((a, index) => {
        if (a.config.id === actionUpdates.id) {
          draftState.actions[index].config.executeOnLoad =
            actionUpdates.executeOnLoad;
        }
      });

      draftState.jsCollections.forEach((js, jsIndex) => {
        js.config.actions.forEach((a, aIndex) => {
          if (a.id === actionUpdates.id) {
            draftState.jsCollections[jsIndex].config.actions[
              aIndex
            ].executeOnLoad = actionUpdates.executeOnLoad;
          }
        });
      });
    });
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },

  [ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<ConvertEntityToInstanceResponse>,
  ) => {
    const { moduleInstanceData } = action.payload;

    moduleInstanceData.entities.actions.forEach((action) => {
      draftState.actions.push({
        isLoading: false,
        config: action,
        data: undefined,
      });
    });

    moduleInstanceData.entities.jsCollections.forEach((jsCollection) => {
      draftState.jsCollections.push({
        isLoading: false,
        config: jsCollection,
        data: undefined,
      });
    });
  },
};

const moduleInstanceEntitiesReducer = createImmerReducer(
  initialState,
  handlers,
);

export default moduleInstanceEntitiesReducer;
