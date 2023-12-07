import { createSelector } from "reselect";
import { groupBy } from "lodash";
import type { AppState } from "@appsmith/reducers";
import type { WorkflowMetadata } from "@appsmith/constants/WorkflowConstants";
import type {
  ApplicationsReduxState,
  creatingApplicationMap,
} from "@appsmith/reducers/uiReducers/applicationsReducer";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import Fuse from "fuse.js";
import type { Workspaces } from "@appsmith/constants/workspaceConstants";
import type { GitApplicationMetadata } from "@appsmith/api/ApplicationApi";
import { hasCreateNewAppPermission } from "@appsmith/utils/permissionHelpers";
import {
  NAVIGATION_SETTINGS,
  SIDEBAR_WIDTH,
  defaultThemeSetting,
} from "constants/AppConstants";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import type { PackageMetadata } from "@appsmith/constants/PackageConstants";
import { getWorkflowsList } from "@appsmith/selectors/workflowSelectors";

const fuzzySearchOptions = {
  keys: ["applications.name", "workspace.name", "packages.name"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

/**
 * Helps injecting packages array into the Workspaces Array.
 * workspacesList
 *  {
 *    workspace: {},
 *    applications: [],
 *    users:[]
 *  }
 *
 *  @returns
 *  {
 *    workspace: {},
 *    applications: [],
 *    users:[],
 *    packages: [],
 *    workflows: [],
 *  }
 */
const injectPackagesAndWorkflowsToWorkspacesList = (
  workspacesList: Workspaces[] = [],
  packages: PackageMetadata[] = [],
  workflows: WorkflowMetadata[] = [],
) => {
  const packagesGroupByWorkspaceId = groupBy(packages, (p) => p.workspaceId);
  const workflowsGroupByWorkspaceId = groupBy(workflows, (w) => w?.workspaceId);

  return workspacesList.map((workspacesObj) => {
    const { workspace } = workspacesObj;

    return {
      ...workspacesObj,
      packages: packagesGroupByWorkspaceId[workspace.id] || [],
      workflows: workflowsGroupByWorkspaceId[workspace.id] || [],
    };
  });
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
  getPackagesList,
  getWorkflowsList,
  (
    applicationsWorkspaces?: Workspaces[],
    keyword?: string,
    packages?: PackageMetadata[],
    workflows?: WorkflowMetadata[],
  ) => {
    const workspacesList = injectPackagesAndWorkflowsToWorkspacesList(
      applicationsWorkspaces,
      packages,
      workflows,
    );

    if (
      workspacesList &&
      workspacesList.length > 0 &&
      keyword &&
      keyword.trim().length > 0
    ) {
      const fuzzy = new Fuse(workspacesList, fuzzySearchOptions);
      const workspaceList = fuzzy.search(keyword);

      return workspaceList.map((workspace) => {
        const appFuzzy = new Fuse(workspace.applications, {
          ...fuzzySearchOptions,
          keys: ["name"],
        });
        const packageFuzzy = new Fuse(workspace.packages, {
          ...fuzzySearchOptions,
          keys: ["name"],
        });
        const workflowFuzzy = new Fuse(workspace.workflows, {
          ...fuzzySearchOptions,
          keys: ["name"],
        });

        return {
          ...workspace,
          applications: appFuzzy.search(keyword),
          packages: packageFuzzy.search(keyword),
          workflows: workflowFuzzy.search(keyword),
        };
      });
    } else if (
      workspacesList &&
      (keyword === undefined || keyword.trim().length === 0)
    ) {
      return workspacesList;
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

export const getIsCreatingApplicationByWorkspaceId = (workspaceId: string) =>
  createSelector(
    getApplicationsState,
    (applications: ApplicationsReduxState) =>
      applications.creatingApplication[workspaceId],
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

export const getIsDatasourceConfigForImportFetched = (state: AppState) =>
  state.ui.applications.isDatasourceConfigForImportFetched;

export const getIsImportingApplication = (state: AppState) =>
  state.ui.applications.importingApplication;

export const getIsImportingPartialApplication = (state: AppState) =>
  state.ui.applications.partialImportExport.isImporting;

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

export const getIsUploadingNavigationLogo = (state: AppState) => {
  return state.ui.applications.isUploadingNavigationLogo;
};

export const getIsDeletingNavigationLogo = (state: AppState) => {
  return state.ui.applications.isDeletingNavigationLogo;
};

const DEFAULT_EVALUATION_VERSION = 2;

export const selectEvaluationVersion = (state: AppState) =>
  state.ui.applications.currentApplication?.evaluationVersion ||
  DEFAULT_EVALUATION_VERSION;

export const getDeletingMultipleApps = (state: AppState) => {
  return state.ui.applications.deletingMultipleApps;
};

export const getApplicationLoadingStates = (state: AppState) => {
  return state.ui.applications?.loadingStates;
};

export const getAllAppUsers = () => [];

export const getCurrentApplicationIdForCreateNewApp = (state: AppState) => {
  return state.ui.applications.currentApplicationIdForCreateNewApp;
};

// Get application from id from userWorkspaces
export const getApplicationByIdFromWorkspaces = createSelector(
  getUserApplicationsWorkspaces,
  (_: AppState, applicationId: string) => applicationId,
  (userWorkspaces, applicationId) => {
    let application: ApplicationPayload | undefined;
    userWorkspaces.forEach((userWorkspace) => {
      if (!application)
        application = userWorkspace.applications.find(
          (i) => i.id === applicationId,
        );
    });
    return application;
  },
);
export const getPartialImportExportLoadingState = (state: AppState) =>
  state.ui.applications.partialImportExport;

export const getCurrentPluginIdForCreateNewApp = (state: AppState) => {
  return state.ui.applications.currentPluginIdForCreateNewApp;
};

export const getAppThemeSettings = (state: AppState) => {
  return (
    state.ui.applications.currentApplication?.applicationDetail?.themeSetting ||
    defaultThemeSetting
  );
};
