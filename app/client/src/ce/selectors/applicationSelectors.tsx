import { createSelector } from "reselect";
import type { AppState } from "@appsmith/reducers";
import type {
  ApplicationsReduxState,
  creatingApplicationMap,
} from "@appsmith/reducers/uiReducers/applicationsReducer";
import type {
  ApplicationPayload,
  WorkspaceDetails,
} from "@appsmith/constants/ReduxActionConstants";
import Fuse from "fuse.js";
import type { Workspaces } from "@appsmith/constants/workspaceConstants";
import type { GitApplicationMetadata } from "@appsmith/api/ApplicationApi";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import { NAVIGATION_SETTINGS, SIDEBAR_WIDTH } from "constants/AppConstants";

const fuzzySearchOptions = {
  keys: ["applications.name", "workspace.name"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

export const getApplicationsState = (state: AppState) => state.ui.applications;
export const getApplications = (state: AppState) =>
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

export const getIsChangingViewAccess = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): boolean =>
    applications.isChangingViewAccess,
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

export const getPageIdForImport = (state: AppState) =>
  state.ui.applications.pageIdForImport;

export const getImportedApplication = (state: AppState) =>
  state.ui.applications.importedApplication;

// Get workspace list where user can create applications
export const getWorkspaceCreateApplication = createSelector(
  getUserApplicationsWorkspaces,
  (userWorkspaces) => {
    return userWorkspaces.filter((userWorkspace) =>
      hasCreateNewAppPermission(userWorkspace.workspace.userPermissions ?? []),
    );
  },
);

export const getAppSidebarPinned = (state: AppState) => {
  return state.ui.applications.isAppSidebarPinned;
};

/**
 * Return the width of the sidbar depending on the sidebar style.
 * If there isn't any sidebar or it is unpinned, return 0.
 */
export const getSidebarWidth = (state: AppState) => {
  const navigationSetting =
    state.ui.applications.currentApplication?.applicationDetail
      ?.navigationSetting;
  const isAppSidebarPinned = state.ui.applications.isAppSidebarPinned;

  if (
    navigationSetting?.showNavbar !== false &&
    navigationSetting?.orientation === NAVIGATION_SETTINGS.ORIENTATION.SIDE &&
    isAppSidebarPinned
  ) {
    if (navigationSetting?.navStyle === NAVIGATION_SETTINGS.NAV_STYLE.MINIMAL) {
      return SIDEBAR_WIDTH.MINIMAL;
    } else {
      return SIDEBAR_WIDTH.REGULAR;
    }
  }

  return 0;
};
