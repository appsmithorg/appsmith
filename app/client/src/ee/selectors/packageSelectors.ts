export * from "ce/selectors/packageSelectors";

import type { AppState } from "@appsmith/reducers";

export const getIsFetchingPackages = (state: AppState) =>
  state.ui.workspaces.loadingStates.isFetchingPackagesList;

export const getIsCreatingPackage = (state: AppState, workspaceId: string) =>
  state.ui.workspaces.loadingStates.packageCreationRequestMap[workspaceId];

export const getPackagesList = (state: AppState) =>
  state.ui.workspaces.packagesList;
