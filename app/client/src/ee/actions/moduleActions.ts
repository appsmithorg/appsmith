import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ModuleType } from "@appsmith/constants/ModuleInstanceConstants";

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

export interface CreateQueryModulePayload {
  datasourceId?: string;
  type: ModuleType;
  from: string;
  packageId: string;
  apiType?: string;
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

export const createQueryModule = (payload: CreateQueryModulePayload) => ({
  type: ReduxActionTypes.CREATE_QUERY_MODULE_INIT,
  payload,
});

export const setCurrentModule = (id: string | null) => ({
  type: ReduxActionTypes.SET_CURRENT_MODULE,
  payload: { id },
});
