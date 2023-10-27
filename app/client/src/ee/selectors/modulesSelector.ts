import type { AppState } from "@appsmith/reducers";
import type { Module } from "@appsmith/constants/ModuleConstants";

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
