import type { AppState } from "@appsmith/reducers";

export const getIsFetchingApplications = (state: AppState): boolean =>
  state.ui.selectedWorkspace.loadingStates.isFetchingApplications;

export const getApplicationsOfWorkspace = (state: AppState) => {
  return state.ui.selectedWorkspace.applications;
};
