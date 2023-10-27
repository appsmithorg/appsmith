import type {
  ModuleId,
  ModuleInstance,
  ModuleInstanceCreatorType,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface CreateQueryModuleInstancePayload {
  moduleId: string;
  creatorId: string;
  onSuccessRedirectURL: string;
  creatorType: ModuleInstanceCreatorType;
}

export interface UpdateModuleInstancePayload {
  id: ModuleInstanceId;
  updates: unknown;
}

export interface FetchModuleInstancesPayload {
  creatorId: string;
  creatorType: string;
}

export const createQueryModuleInstance = (
  payload: CreateQueryModuleInstancePayload,
) => ({
  type: ReduxActionTypes.CREATE_MODULE_INSTANCE_INIT,
  payload,
});

export const deleteModuleInstance = (id: string) => ({
  type: ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT,
  payload: { id },
});

export const updateModuleInstance = (payload: UpdateModuleInstancePayload) => ({
  type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT,
  payload,
});

export const fetchModuleInstances = (payload: FetchModuleInstancesPayload) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_INIT,
  payload,
});

export const createQueryModuleInstanceSuccess = (payload: ModuleInstance) => ({
  type: ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS,
  payload,
});

export const deleteModuleInstanceSuccess = (id: ModuleId) => ({
  type: ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS,
  payload: { id },
});

export const updateModuleInstanceSuccess = (payload: ModuleInstance) => ({
  type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS,
  payload,
});

export const fetchModuleInstancesSuccess = (payload: ModuleInstance[]) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
  payload,
});
