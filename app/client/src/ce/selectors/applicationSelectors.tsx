import { createSelector } from "reselect";
import { memoize } from "lodash";
import type { AppState } from "ee/reducers";
import type {
  ApplicationsReduxState,
  creatingApplicationMap,
} from "ee/reducers/uiReducers/applicationsReducer";
import type { ApplicationPayload } from "entities/Application";
import Fuse from "fuse.js";
import type { GitApplicationMetadata } from "ee/api/ApplicationApi";
import { getApplicationsOfWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import {
  NAVIGATION_SETTINGS,
  SIDEBAR_WIDTH,
  type ThemeSetting,
  defaultThemeSetting,
} from "constants/AppConstants";
import { DEFAULT_EVALUATION_VERSION } from "constants/EvalConstants";

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

export const selectEvaluationVersion = (state: AppState) =>
  state.ui.applications.currentApplication?.evaluationVersion ||
  DEFAULT_EVALUATION_VERSION;

export const getApplicationLoadingStates = (state: AppState) => {
  return state.ui.applications?.loadingStates;
};

export const getAllAppUsers = () => [];

export const getCurrentApplicationIdForCreateNewApp = (state: AppState) => {
  return state.ui.applications.currentApplicationIdForCreateNewApp;
};

export const getPartialImportExportLoadingState = (state: AppState) =>
  state.ui.applications.partialImportExport;

export const getCurrentPluginIdForCreateNewApp = (state: AppState) => {
  return state.ui.applications.currentPluginIdForCreateNewApp;
};

export const getApplicationByIdFromWorkspaces = createSelector(
  getApplicationsOfWorkspace,
  (_: AppState, applicationId: string) => applicationId,
  (applications, applicationId) => {
    const application: ApplicationPayload | undefined = applications.find(
      (app) => app.id === applicationId,
    );

    return application;
  },
);

const getMemoizedThemeObj = memoize(
  (themeSetting: ThemeSetting | undefined) => {
    return {
      ...defaultThemeSetting,
      ...themeSetting,
    };
  },
);

export const getAppThemeSettings = (state: AppState) => {
  return getMemoizedThemeObj(
    state.ui.applications.currentApplication?.applicationDetail?.themeSetting,
  );
};
