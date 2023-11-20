import type {
  ModuleInstanceCreatorType,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface CreateQueryModuleInstancePayload {
  moduleId: string;
  creatorId: string;
  creatorType: ModuleInstanceCreatorType;
}

export interface UpdateModuleInstancePayload {
  id: ModuleInstanceId;
  updates: unknown;
}

export interface FetchModuleInstancesPayload {
  creatorId: string;
  creatorType: ModuleInstanceCreatorType;
}

export interface FetchModuleInstanceEntitiesPayload {
  creatorId: string;
  creatorType: ModuleInstanceCreatorType;
}

export interface SetupModuleInstancePayload {
  creatorId: string;
  creatorType: ModuleInstanceCreatorType;
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

export const fetchModuleInstancesForView = (
  payload: FetchModuleInstancesPayload,
) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_INIT,
  payload,
});

export const setupModuleInstances = (payload: SetupModuleInstancePayload) => ({
  type: ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
  payload,
});

export const setupModuleInstancesForView = (
  payload: SetupModuleInstancePayload,
) => ({
  type: ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_INIT,
  payload,
});

export const fetchModuleInstanceEntities = (
  payload: FetchModuleInstanceEntitiesPayload,
) => ({
  type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
  payload,
});
