export * from "ce/selectors/packageSelectors";
import type { AppState } from "@appsmith/reducers";
import { MODULE_MODE } from "@appsmith/entities/package";

import { createSelector } from "reselect";
import type { Module } from "@appsmith/constants/ModuleConstants";
import {
  ENTITY_EXPLORER_RENDER_ORDER,
  MODULE_TYPE,
} from "@appsmith/constants/ModuleConstants";

//package creator
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getModuleMode = (state: AppState) => MODULE_MODE.EDIT;

export const getIsFetchingPackages = (state: AppState) =>
  state.ui.workspaces.loadingStates.isFetchingPackagesList;

export const getIsCreatingPackage = (state: AppState, workspaceId: string) =>
  state.ui.workspaces.loadingStates.packageCreationRequestMap[workspaceId];

export const getPackagesList = (state: AppState) =>
  state.ui.workspaces.packagesList;

export const getCurrentPackageId = (state: AppState) =>
  state.ui.editor?.currentPackageId;

export const getPackages = (state: AppState) => state.entities.packages;

export const getCurrentPackage = createSelector(
  getCurrentPackageId,
  getPackages,
  (currentPackageId, packages) =>
    currentPackageId ? packages[currentPackageId] : null,
);

export const getIsPackageEditorInitialized = (state: AppState) =>
  state.ui.editor.isPackageEditorInitialized;

export const getIsSavingPackageName = (state: AppState) =>
  state.ui.workspaces.isSavingPkgName;

export const getisErrorSavingPackageName = (state: AppState) =>
  state.ui.workspaces.isErrorSavingPkgName;

export const getIsPackagePublishing = (state: AppState) =>
  state.ui.editor.isPackagePublishing;

export const getFirstModule = (state: AppState) => {
  const modules = Object.values(state.entities.modules);
  const firstModuleOfEachType: Record<MODULE_TYPE, Module | undefined> = {
    [MODULE_TYPE.UI]: undefined,
    [MODULE_TYPE.QUERY]: undefined,
    [MODULE_TYPE.JS]: undefined,
  };

  modules.forEach((module) => {
    if (!firstModuleOfEachType[module.type]) {
      firstModuleOfEachType[module.type] = module;
    }
  });

  return ENTITY_EXPLORER_RENDER_ORDER.reduce(
    (acc: Module | undefined, next) => {
      acc = acc || firstModuleOfEachType[next];

      return acc;
    },
    undefined,
  );
};

export const getModulesMetadata = (state: AppState) =>
  state.ui.explorer.modulesMetadata;
