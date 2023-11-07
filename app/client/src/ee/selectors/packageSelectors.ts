export * from "ce/selectors/packageSelectors";
import type { AppState } from "@appsmith/reducers";
import { MODULE_MODE } from "@appsmith/entities/package";

import { createSelector } from "reselect";

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
