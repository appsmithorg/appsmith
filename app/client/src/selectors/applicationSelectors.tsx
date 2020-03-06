import { createSelector } from "reselect";
import { AppState } from "reducers";
import { ApplicationsReduxState } from "reducers/uiReducers/applicationsReducer";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import Fuse from "fuse.js";

const fuzzySearchOptions = {
  keys: ["name"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

const getApplicationsState = (state: AppState) => state.ui.applications;
const getApplications = (state: AppState) =>
  state.ui.applications.applicationList;
export const getCurrentApplication = (state: AppState) =>
  state.ui.applications.currentApplication;
const getApplicationSearchKeyword = (state: AppState) =>
  state.ui.applications.searchKeyword;
export const getIsDeletingApplication = (state: AppState) =>
  state.ui.applications.deletingApplication;

export const getApplicationList = createSelector(
  getApplications,
  getApplicationSearchKeyword,
  (
    applications?: ApplicationPayload[],
    keyword?: string,
  ): ApplicationPayload[] => {
    if (
      applications &&
      applications.length > 0 &&
      keyword &&
      keyword.trim().length > 0
    ) {
      const fuzzy = new Fuse(applications, fuzzySearchOptions);
      return fuzzy.search(keyword) as ApplicationPayload[];
    } else if (
      applications &&
      (keyword === undefined || keyword.trim().length === 0)
    ) {
      return applications;
    }
    return [];
  },
);

export const getIsFetchingApplications = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): boolean =>
    applications.isFetchingApplications,
);

export const getIsCreatingApplication = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): boolean =>
    applications.creatingApplication,
);

export const getCreateApplicationError = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): string | undefined =>
    applications.createApplicationError,
);
