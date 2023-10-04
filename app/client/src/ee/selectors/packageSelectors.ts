export * from "ce/selectors/packageSelectors";

import { createSelector } from "reselect";

import type { AppState } from "@appsmith/reducers";

export const getIsFetchingPackages = (state: AppState) =>
  state.ui.workspaces.loadingStates.isFetchingPackagesList;

export const getIsCreatingPackage = (state: AppState, workspaceId: string) =>
  state.ui.workspaces.loadingStates.packageCreationRequestMap[workspaceId];

export const getPackagesList = (state: AppState) =>
  state.ui.workspaces.packagesList;

export const getCurrentPackageId = (state: AppState) =>
  state.ui.editor.currentPackageId;

export const getPackages = (state: AppState) => state.entities.packages;

export const getCurrentPackage = createSelector(
  getCurrentPackageId,
  getPackages,
  (currentPackageId, packages) =>
    currentPackageId ? packages[currentPackageId] : null,
);

export const getIsPackageEditorInitialized = (state: AppState) =>
  state.ui.editor.isPackageEditorInitialized;
