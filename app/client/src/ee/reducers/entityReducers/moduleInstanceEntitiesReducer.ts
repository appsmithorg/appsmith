import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { ActionData } from "./actionsReducer";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { ActionResponse } from "api/ActionAPI";
import type { ExecuteErrorPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { assign, set } from "lodash";
import type { UpdateActionPropertyActionPayload } from "actions/pluginActionActions";
import type {
  CreateModuleInstanceResponse,
  FetchModuleInstanceEntitiesResponse,
} from "@appsmith/api/ModuleInstanceApi";

export interface ModuleInstanceEntitiesReducerState {
  actions: ActionData[];
  jsCollections: JSCollectionData[];
}

const initialState: ModuleInstanceEntitiesReducerState = {
  actions: [],
  jsCollections: [],
};

export const handlers = {
  [ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<FetchModuleInstanceEntitiesResponse>,
  ) => {
    const actions = action.payload.actions.map((action) => {
      return {
        isLoading: false,
        config: action,
        data: undefined,
      };
    });
    const jsCollections = action.payload.jsCollections.map((jsCollection) => {
      return {
        isLoading: false,
        config: jsCollection,
        data: undefined,
      };
    });
    return {
      actions,
      jsCollections,
    };
  },
  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<Action>,
  ) => {
    const index = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (index !== -1) {
      draftState.actions[index].config = action.payload;
    }

    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<Action>,
  ) => {
    const index = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (index !== -1) {
      draftState.actions[index].config = action.payload;
    }

    return draftState;
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
    // draftState.jsCollections.filter(
    //   (a) => a.config.id === action.payload.id,
    // );
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
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = true;
      }
    });
  },
  [ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS]: (
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string; response: ActionResponse }>,
  ) => {
    const foundAction = draftMetaState.actions.find((stateAction) => {
      return stateAction.config.id === action.payload.id;
    });
    if (foundAction) {
      foundAction.isLoading = false;
      foundAction.data = action.payload.response;
    }
  },
  [ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR]: (
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<ExecuteErrorPayload>,
  ) => {
    draftMetaState.actions.forEach((a) => {
      if (a.config.id === action.payload.actionId) {
        a.isLoading = false;
        a.data = action.payload.data;
      }
    });
  },

  [ReduxActionTypes.RUN_ACTION_REQUEST]: (
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.actions.forEach((a) => {
      if (action.payload.id === a.config.id) {
        a.isLoading = true;
      }
    });
  },
  [ReduxActionTypes.RUN_ACTION_SUCCESS]: (
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => {
    const actionId = Object.keys(action.payload)[0];
    draftMetaState.actions.forEach((a) => {
      if (a.config.id === actionId) {
        a.isLoading = false;
        if (a.data) assign(a.data, action.payload[actionId]);
        else a.data = action.payload[actionId];
      }
    });
  },
  [ReduxActionErrorTypes.RUN_ACTION_ERROR]: (
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });
  },
  [ReduxActionTypes.RUN_ACTION_CANCELLED]: (
    draftMetaState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<{ id: string }>,
  ) => {
    draftMetaState.actions.forEach((a) => {
      if (a.config.id === action.payload.id) {
        a.isLoading = false;
      }
    });
  },
};

const moduleInstanceEntitiesReducer = createImmerReducer(
  initialState,
  handlers,
);

export default moduleInstanceEntitiesReducer;
