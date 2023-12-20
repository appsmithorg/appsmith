import type {
  ModuleInstance,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import type { AppState } from "@appsmith/reducers";
import type { Action } from "entities/Action";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import type { QueryModuleInstanceEntity } from "@appsmith/entities/DataTree/types";

const DEFAULT_SAVING_STATUS = {
  isSaving: false,
  error: false,
};

const DEFAULT_RUNNING_STATUS = {
  isRunning: false,
};

const DEFAULT_INPUT_EVAL_VALUES = {};

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
    (action: ActionData) => {
      return (
        action.config.moduleInstanceId === moduleInstanceId &&
        action.config.isPublic
      );
    },
  );

  return action?.config;
};

export const getModuleInstancePublicJSCollectionData = (
  state: AppState,
  moduleInstanceId: string,
) => {
  const jsCollectionData: JSCollectionData | undefined =
    state.entities.moduleInstanceEntities.jsCollections.find(
      (js: JSCollectionData) => {
        return (
          js.config.moduleInstanceId === moduleInstanceId && js.config.isPublic
        );
      },
    );

  return jsCollectionData;
};

export const getIsJSModuleInstanceActionExecuting = (
  state: AppState,
  moduleInstanceId?: string,
  actionId?: string | null,
) => {
  if (!moduleInstanceId || !actionId) return false;

  const jsCollectionData: JSCollectionData | undefined =
    state.entities.moduleInstanceEntities.jsCollections.find(
      (js: JSCollectionData) => {
        return (
          js.config.moduleInstanceId === moduleInstanceId && js.config.isPublic
        );
      },
    );

  return jsCollectionData?.isExecuting?.[actionId] || false;
};

export const getModuleInstanceActiveJSActionId = (
  state: AppState,
  jsCollectionId: string,
): string | null => {
  const jsCollection = state.entities.moduleInstanceEntities.jsCollections.find(
    (jsCollectionData: JSCollectionData) =>
      jsCollectionData.config.id === jsCollectionId,
  );
  return jsCollection?.activeJSActionId ?? null;
};

export const getModuleInstanceActionResponse = (
  state: AppState,
  actionId: string,
) => {
  const action = state.entities.moduleInstanceEntities.actions.find(
    ({ config }: { config: Action }) => config.id === actionId,
  );

  return action?.data;
};

export const getIsModuleInstanceRunningStatus = (
  state: AppState,
  moduleInstanceId: string,
) =>
  state.ui.moduleInstancePane.runningStatus[moduleInstanceId] ||
  DEFAULT_RUNNING_STATUS;

export const getModuleInstanceEvalValues = (
  state: AppState,
  moduleInstanceName: string,
) => {
  const moduleInstance = state.evaluations.tree[
    moduleInstanceName
  ] as QueryModuleInstanceEntity;

  return moduleInstance?.inputs || DEFAULT_INPUT_EVAL_VALUES;
};
