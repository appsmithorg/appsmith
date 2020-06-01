import { createSelector } from "reselect";
import { AppState } from "reducers";
import { ApplicationsReduxState } from "reducers/uiReducers/applicationsReducer";
import {
  ApplicationPayload,
  OrganizationDetails,
} from "constants/ReduxActionConstants";
import Fuse from "fuse.js";
import { UserApplication } from "constants/userConstants";

const fuzzySearchOptions = {
  keys: ["applications.name"],
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
export const getUserApplicationsOrgs = (state: AppState) =>
  state.ui.applications.userApplicationsOrgs;

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

export const getUserApplicationsOrgsList = createSelector(
  getUserApplicationsOrgs,
  getApplicationSearchKeyword,
  (applicationsOrgs?: [], keyword?: string): OrganizationDetails[] => {
    if (
      applicationsOrgs &&
      applicationsOrgs.length > 0 &&
      keyword &&
      keyword.trim().length > 0
    ) {
      const fuzzy = new Fuse(applicationsOrgs, fuzzySearchOptions);
      let organizationList = fuzzy.search(keyword) as OrganizationDetails[];
      organizationList = organizationList.map(org => {
        const applicationFuzzy = new Fuse(org.applications, {
          ...fuzzySearchOptions,
          keys: ["name"],
        });
        const applications = applicationFuzzy.search(keyword) as [];

        return {
          ...org,
          applications,
        };
      });

      return organizationList;
    } else if (
      applicationsOrgs &&
      (keyword === undefined || keyword.trim().length === 0)
    ) {
      return applicationsOrgs;
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
