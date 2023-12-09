import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Module } from "@appsmith/constants/ModuleConstants";

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

export const fetchModuleActions = (payload: FetchModuleActionsPayload) => ({
  type: ReduxActionTypes.FETCH_MODULE_ACTIONS_INIT,
  payload,
});

export const setupModule = (payload: SetupModulePayload) => ({
  type: ReduxActionTypes.SETUP_MODULE_INIT,
  payload,
});

export const createQueryModule = (payload: CreateQueryModulePayload) => ({
  type: ReduxActionTypes.CREATE_QUERY_MODULE_INIT,
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
