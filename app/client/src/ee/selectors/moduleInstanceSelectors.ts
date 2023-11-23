import type {
  ModuleInstance,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import type { AppState } from "@appsmith/reducers";
import type { Action } from "entities/Action";

const DEFAULT_SAVING_STATUS = {
  isSaving: false,
  error: false,
};

export const getAllModuleInstances = (
  state: AppState,
): Record<ModuleInstanceId, ModuleInstance> => state.entities.moduleInstances;

export const getModuleInstanceById = (
  state: AppState,
  id: string,
): ModuleInstance | undefined => state.entities.moduleInstances[id];

export const getIsModuleInstanceNameSavingStatus = (
  state: AppState,
  moduleInstanceId: string,
) => {
  return (
    state.ui.moduleInstancePane.nameSavingStatus[moduleInstanceId] ||
    DEFAULT_SAVING_STATUS
  );
};

export const getModuleInstancePublicAction = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: AppState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moduleInstanceId: string,
): Action | undefined => {
  // TODO: (Ashit) - When contextId and contextType comes
  return undefined;
};
