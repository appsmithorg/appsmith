import type { AppState } from "@appsmith/reducers";

export const getAllModules = (state: AppState) => state.entities.modules;

export const getCurrentModuleId = (state: AppState) =>
  state.ui.editor.currentModuleId || "";

export const getModulePermissions = (state: AppState) => {
  const moduleId = getCurrentModuleId(state);
  const module = state.entities.modules[moduleId];

  return module?.userPermissions || [];
};
