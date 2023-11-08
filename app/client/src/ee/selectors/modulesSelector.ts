import type { AppState } from "@appsmith/reducers";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { createSelector } from "reselect";
import type { Action } from "entities/Action";

export const getAllModules = (state: AppState) => state.entities.modules;

export const getCurrentModuleId = (state: AppState) =>
  state.ui.editor.currentModuleId || "";

export const getModulePermissions = (state: AppState) => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];

  return module?.userPermissions || [];
};

export const getModuleById = (
  state: AppState,
  moduleId: string,
): Module | undefined => state.entities.modules[moduleId];

export const getIsModuleFetchingActions = (state: AppState) =>
  state.ui.editor.isModuleFetchingActions;

export const getInputsForModule = createSelector(
  getAllModules,
  getCurrentModuleId,
  (modules, currentModuleId) => {
    return modules[currentModuleId].inputs;
  },
);

export const getModulePublicAction = (
  state: AppState,
  moduleId: string,
): Action | undefined => {
  const action = state.entities.actions.find(
    (action) => action.config.moduleId === moduleId && action.config.isPublic,
  );

  return action ? action.config : undefined;
};
