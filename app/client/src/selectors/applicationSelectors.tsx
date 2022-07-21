import { createSelector } from "reselect";
import { AppState } from "reducers";
import {
  ApplicationsReduxState,
  creatingApplicationMap,
} from "reducers/uiReducers/applicationsReducer";
import {
  ApplicationPayload,
  WorkspaceDetails,
} from "@appsmith/constants/ReduxActionConstants";
import Fuse from "fuse.js";
import { Workspaces } from "constants/workspaceConstants";
import { GitApplicationMetadata } from "api/ApplicationApi";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";

const fuzzySearchOptions = {
  keys: ["applications.name", "workspace.name"],
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
): ApplicationPayload | undefined => {
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
export const getUserApplicationsWorkspaces = (state: AppState) => {
  return state.ui.applications.userWorkspaces;
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

export const getUserApplicationsWorkspacesList = createSelector(
  getUserApplicationsWorkspaces,
  getApplicationSearchKeyword,
  (
    applicationsWorkspaces?: Workspaces[],
    keyword?: string,
  ): WorkspaceDetails[] => {
    if (
      applicationsWorkspaces &&
      applicationsWorkspaces.length > 0 &&
      keyword &&
      keyword.trim().length > 0
    ) {
      const fuzzy = new Fuse(applicationsWorkspaces, fuzzySearchOptions);
      let workspaceList = fuzzy.search(keyword) as WorkspaceDetails[];
      workspaceList = workspaceList.map((workspace) => {
        const applicationFuzzy = new Fuse(workspace.applications, {
          ...fuzzySearchOptions,
          keys: ["name"],
        });
        const applications = applicationFuzzy.search(keyword) as any[];

        return {
          ...workspace,
          applications,
        };
      });

      return workspaceList;
    } else if (
      applicationsWorkspaces &&
      (keyword === undefined || keyword.trim().length === 0)
    ) {
      return applicationsWorkspaces;
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

export const getIsSavingWorkspaceInfo = (state: AppState) =>
  state.ui.applications.isSavingWorkspaceInfo;

export const showAppInviteUsersDialogSelector = (state: AppState) =>
  state.ui.applications.showAppInviteUsersDialog;

export const getIsDatasourceConfigForImportFetched = (state: AppState) =>
  state.ui.applications.isDatasourceConfigForImportFetched;

export const getIsImportingApplication = (state: AppState) =>
  state.ui.applications.importingApplication;

export const getWorkspaceIdForImport = (state: AppState) =>
  state.ui.applications.workspaceIdForImport;

export const getImportedApplication = (state: AppState) =>
  state.ui.applications.importedApplication;

// Get workspace list where user can create applications
export const getWorkspaceCreateApplication = createSelector(
  getUserApplicationsWorkspaces,
  (userWorkspaces) => {
    return userWorkspaces.filter((userWorkspace) =>
      isPermitted(
        userWorkspace.workspace.userPermissions || [],
        PERMISSION_TYPE.CREATE_APPLICATION,
      ),
    );
  },
);
