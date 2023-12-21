import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  type ReduxAction,
  type AnyReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";

export interface SaveModuleNamePayload {
  id: string;
  name: string;
}
export interface DeleteModulePayload {
  id: string;
  onSuccess?: () => void;
}

export interface FetchModuleActionsPayload {
  moduleId: string;
}

export interface SetupModulePayload {
  moduleId: string;
}

export interface CreateQueryModulePayload {
  datasourceId?: string;
  type: MODULE_TYPE;
  from: string;
  packageId: string;
  apiType?: string;
}
export interface CreateJSModulePayload {
  from: string;
  packageId: string;
}

export interface UpdateModuleInputsPayload {
  id: string;
  inputsForm: Module["inputsForm"];
}

export const saveModuleName = (payload: SaveModuleNamePayload) => {
  return {
    type: ReduxActionTypes.SAVE_MODULE_NAME_INIT,
    payload,
  };
};

export const deleteModule = (payload: DeleteModulePayload) => {
  return {
    type: ReduxActionTypes.DELETE_QUERY_MODULE_INIT,
    payload,
  };
};

export const setupModule = (payload: SetupModulePayload) => ({
  type: ReduxActionTypes.SETUP_MODULE_INIT,
  payload,
});

export const createQueryModule = (payload: CreateQueryModulePayload) => ({
  type: ReduxActionTypes.CREATE_QUERY_MODULE_INIT,
  payload,
});

export const createJSModule = (payload: CreateJSModulePayload) => ({
  type: ReduxActionTypes.CREATE_JS_MODULE_INIT,
  payload,
});

export const setCurrentModule = (id?: string) => ({
  type: ReduxActionTypes.SET_CURRENT_MODULE,
  payload: { id },
});

export const updateModuleInputs = (payload: UpdateModuleInputsPayload) => ({
  type: ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT,
  payload: payload,
});

/**
 * After all entities are fetched, we trigger evaluation using this redux action, here we supply postEvalActions
 * to trigger action after evaluation has been completed like executeOnPageLoadAction
 *
 * @param {Array<AnyReduxAction>} postEvalActions
 */
export const fetchAllModuleEntityCompletion = (
  postEvalActions: Array<AnyReduxAction>,
) => ({
  type: ReduxActionTypes.FETCH_ALL_MODULE_ENTITY_COMPLETION,
  postEvalActions,
  payload: undefined,
});

export const createNewQueryActionForPackage = (
  moduleId: string,
  from: EventLocation,
  datasourceId: string,
) => {
  return {
    type: ReduxActionTypes.CREATE_NEW_QUERY_ACTION_FOR_PACKAGE,
    payload: {
      moduleId,
      from,
      datasourceId,
    },
  };
};

export const createNewAPIActionForPackage = (
  moduleId: string,
  from: EventLocation,
  apiType?: string,
) => {
  return {
    type: ReduxActionTypes.CREATE_NEW_API_ACTION_FOR_PACKAGE,
    payload: {
      moduleId,
      from,
      apiType,
    },
  };
};

export const createNewJSCollectionForPackage = (
  moduleId: string,
  from: EventLocation,
): ReduxAction<{ moduleId: string; from: EventLocation }> => ({
  type: ReduxActionTypes.CREATE_NEW_JS_ACTION_FOR_PACKAGE,
  payload: { moduleId, from: from },
});

export const saveActionNameForPackage = (payload: {
  id: string;
  name: string;
}) => ({
  type: ReduxActionTypes.SAVE_ACTION_NAME_FOR_PACKAGE_INIT,
  payload,
});

export const saveJSObjectNameForPackage = (payload: {
  id: string;
  name: string;
}) => ({
  type: ReduxActionTypes.SAVE_JS_OBJECT_NAME_FOR_PACKAGE_INIT,
  payload,
});
