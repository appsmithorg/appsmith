import { createSelector } from "reselect";
import { AppState } from "reducers";
import {
  ApplicationsReduxState,
  creatingApplicationMap,
} from "reducers/uiReducers/applicationsReducer";
import {
  ApplicationPayload,
  OrganizationDetails,
  CurrentApplicationData,
} from "constants/ReduxActionConstants";
import Fuse from "fuse.js";
import { Organization } from "constants/orgConstants";
import { GitApplicationMetadata } from "../api/ApplicationApi";

const fuzzySearchOptions = {
  keys: ["applications.name", "organization.name"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

const getApplicationsState = (state: AppState) => state.ui.applications;
const getApplications = (state: AppState) =>
  state.ui.applications.applicationList;
export const getCurrentApplication = (
  state: AppState,
): CurrentApplicationData | undefined => {
  return state.ui.applications.currentApplication;
};
export const getApplicationSearchKeyword = (state: AppState) =>
  state.ui.applications.searchKeyword;
export const getAppMode = (state: AppState) => state.entities.app.mode;
export const getIsDeletingApplication = (state: AppState) =>
  state.ui.applications.deletingApplication;
export const getIsDuplicatingApplication = (state: AppState) =>
  state.ui.applications.duplicatingApplication;
export const getIsSavingAppName = (state: AppState) =>
  state.ui.applications.isSavingAppName;
export const getIsErroredSavingAppName = (state: AppState) =>
  state.ui.applications.isErrorSavingAppName;
export const getUserApplicationsOrgs = (state: AppState) => {
  return state.ui.applications.userOrgs;
};

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
  (
    applicationsOrgs?: Organization[],
    keyword?: string,
  ): OrganizationDetails[] => {
    if (
      applicationsOrgs &&
      applicationsOrgs.length > 0 &&
      keyword &&
      keyword.trim().length > 0
    ) {
      const fuzzy = new Fuse(applicationsOrgs, fuzzySearchOptions);
      let organizationList = fuzzy.search(keyword) as OrganizationDetails[];
      organizationList = organizationList.map((org) => {
        const applicationFuzzy = new Fuse(org.applications, {
          ...fuzzySearchOptions,
          keys: ["name"],
        });
        const applications = applicationFuzzy.search(keyword) as any[];

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
  (applications: ApplicationsReduxState): creatingApplicationMap =>
    applications.creatingApplication,
);

export const getCreateApplicationError = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): string | undefined =>
    applications.createApplicationError,
);

export const getIsDeletingApplications = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): boolean =>
    applications.deletingApplication,
);

export const getCurrentAppGitMetaData = createSelector(
  getCurrentApplication,
  (currentApplication): GitApplicationMetadata | undefined =>
    currentApplication?.gitApplicationMetadata,
);

export const getCurrentAppSSHKeyPair = createSelector(
  getCurrentApplication,
  (currentApplication): string | undefined => currentApplication?.SSHKeyPair,
);

export const getIsSavingOrgInfo = (state: AppState) =>
  state.ui.applications.isSavingOrgInfo;

export const showAppInviteUsersDialogSelector = (state: AppState) =>
  state.ui.applications.showAppInviteUsersDialog;
