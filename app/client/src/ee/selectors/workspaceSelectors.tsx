export * from "ce/selectors/workspaceSelectors";
import type { AppState } from "@appsmith/reducers";

export const getGroupSuggestions = (state: AppState) => {
  return state.ui.workspaces.groupSuggestions;
};

export const getIsImportingPackage = (state: AppState) => {
  return state.ui.workspaces.loadingStates.isImportingPackage;
};
