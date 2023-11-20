import type {
  ModuleInstance,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import type { AppState } from "@appsmith/reducers";

export const getAllModuleInstances = (
  state: AppState,
): Record<ModuleInstanceId, ModuleInstance> => state.entities.moduleInstances;

export const getModuleInstanceById = (
  state: AppState,
  id: string,
): ModuleInstance | undefined => state.entities.moduleInstances[id];
