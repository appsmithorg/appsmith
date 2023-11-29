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

const DEFAULT_RUNNING_STATUS = {
  isRunning: false,
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
  state: AppState,
  moduleInstanceId: string,
): Action | undefined => {
  const action = state.entities.moduleInstanceEntities.actions.find(
    (action) => {
      return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        action.config.moduleInstanceId === moduleInstanceId &&
        action.config.isPublic
      );
    },
  );

  return action?.config;
};

export const getModuleInstanceActionResponse = (
  state: AppState,
  actionId: string,
) => {
  const action = state.entities.moduleInstanceEntities.actions.find(
    ({ config }) => config.id === actionId,
  );

  return action?.data;
};

export const getIsModuleInstanceRunningStatus = (
  state: AppState,
  moduleInstanceId: string,
) =>
  state.ui.moduleInstancePane.runningStatus[moduleInstanceId] ||
  DEFAULT_RUNNING_STATUS;
