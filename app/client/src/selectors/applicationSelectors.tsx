import { createSelector } from "reselect";
import { AppState } from "reducers";
import { ApplicationsReduxState } from "reducers/uiReducers/applicationsReducer";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import Fuse from "fuse.js";
import { UserApplication } from "constants/userConstants";

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
export const getCurrentApplication = (state: AppState): UserApplication => {
  const appId = state.entities.pageList.applicationId;
  const apps = state.ui.users.current
    ? state.ui.users.current.applications
    : [];
  const app = apps.find(app => app.id === appId);

  return (
    app || {
      id: "",
      name: "",
    }
  );
};
const getApplicationSearchKeyword = (state: AppState) =>
  state.ui.applications.searchKeyword;
export const getIsDeletingApplication = (state: AppState) =>
  state.ui.applications.deletingApplication;

export const getImportedCollections = (state: AppState) =>
  state.ui.importedCollections.importedCollections;

export const getProviders = (state: AppState) => state.ui.providers.providers;
export const getProvidersLoadingState = (state: AppState) =>
  state.ui.providers.isFetchingProviders;
export const getProviderTemplates = (state: AppState) =>
  state.ui.providers.providerTemplates;
export const getProvidersTemplatesLoadingState = (state: AppState) =>
  state.ui.providers.isFetchingProviderTemplates;

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
