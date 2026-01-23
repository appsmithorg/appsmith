import { createSelector } from "reselect";
import { memoize } from "lodash";
import type { DefaultRootState } from "react-redux";
import type {
  ApplicationsReduxState,
  creatingApplicationMap,
} from "ee/reducers/uiReducers/applicationsReducer";
import type { ApplicationPayload } from "entities/Application";
import Fuse from "fuse.js";
import type { GitApplicationMetadata } from "ee/api/ApplicationApi";
import { getApplicationsOfWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { type ThemeSetting, defaultThemeSetting } from "constants/AppConstants";
import { DEFAULT_EVALUATION_VERSION } from "constants/EvalConstants";
import {
  REDEPLOY_TRIGGERS,
  type RedeployTriggerValue,
} from "ee/constants/DeploymentConstants";

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

export const getApplicationsState = (state: DefaultRootState) =>
  state.ui.applications;
export const getApplications = (state: DefaultRootState) =>
  state.ui.applications.applicationList;
export const getCurrentApplication = (
  state: DefaultRootState,
): ApplicationPayload | undefined => {
  return state.ui.applications.currentApplication;
};
export const getApplicationSearchKeyword = (state: DefaultRootState) =>
  state.ui.applications.searchKeyword;
export const getAppMode = (state: DefaultRootState) => state.entities.app.mode;
export const getIsDeletingApplication = (state: DefaultRootState) =>
  state.ui.applications.deletingApplication;
export const getIsSavingAppName = (state: DefaultRootState) =>
  state.ui.applications.isSavingAppName;
export const getIsErroredSavingAppName = (state: DefaultRootState) =>
  state.ui.applications.isErrorSavingAppName;
export const getIsPersistingAppSlug = (state: DefaultRootState) =>
  state.ui.applications.isPersistingAppSlug;
export const getIsValidatingAppSlug = (state: DefaultRootState) =>
  state.ui.applications.isValidatingAppSlug;
export const getIsApplicationSlugValid = (state: DefaultRootState) =>
  state.ui.applications.isApplicationSlugValid;

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

export const getIsDatasourceConfigForImportFetched = (
  state: DefaultRootState,
) => state.ui.applications.isDatasourceConfigForImportFetched;

export const getIsImportingApplication = (state: DefaultRootState) =>
  state.ui.applications.importingApplication;

export const getIsImportingPartialApplication = (state: DefaultRootState) =>
  state.ui.applications.partialImportExport.isImporting;

export const getWorkspaceIdForImport = (state: DefaultRootState) =>
  state.ui.applications.workspaceIdForImport;

export const getPageIdForImport = (state: DefaultRootState) =>
  state.ui.applications.pageIdForImport;

export const getImportedApplication = (state: DefaultRootState) =>
  state.ui.applications.importedApplication;

export const getAppSidebarPinned = (state: DefaultRootState) => {
  return state.ui.applications.isAppSidebarPinned;
};

export const getIsUploadingNavigationLogo = (state: DefaultRootState) => {
  return state.ui.applications.isUploadingNavigationLogo;
};

export const getIsDeletingNavigationLogo = (state: DefaultRootState) => {
  return state.ui.applications.isDeletingNavigationLogo;
};

export const selectEvaluationVersion = (state: DefaultRootState) =>
  state.ui.applications.currentApplication?.evaluationVersion ||
  DEFAULT_EVALUATION_VERSION;

export const getApplicationLoadingStates = (state: DefaultRootState) => {
  return state.ui.applications?.loadingStates;
};

export const getAllAppUsers = () => [];

export const getCurrentApplicationIdForCreateNewApp = (
  state: DefaultRootState,
) => {
  return state.ui.applications.currentApplicationIdForCreateNewApp;
};

export const getPartialImportExportLoadingState = (state: DefaultRootState) =>
  state.ui.applications.partialImportExport;

export const getCurrentPluginIdForCreateNewApp = (state: DefaultRootState) => {
  return state.ui.applications.currentPluginIdForCreateNewApp;
};

export const getApplicationByIdFromWorkspaces = createSelector(
  getApplicationsOfWorkspace,
  (_: DefaultRootState, applicationId: string) => applicationId,
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

export const getAppThemeSettings = (state: DefaultRootState) => {
  return getMemoizedThemeObj(
    state.ui.applications.currentApplication?.applicationDetail?.themeSetting,
  );
};

export const getIsFetchingAppSlugSuggestion = (state: DefaultRootState) =>
  state.ui.applications.isFetchingAppSlugSuggestion;

export const getAppSlugSuggestion = (state: DefaultRootState) =>
  state.ui.applications.appSlugSuggestion;

export const getRedeployApplicationTrigger = createSelector(
  getCurrentApplication,
  (currentApplication): RedeployTriggerValue | null => {
    if (!currentApplication?.modifiedAt) {
      return null;
    }

    if (!currentApplication?.lastDeployedAt) {
      return REDEPLOY_TRIGGERS.PendingDeployment;
    }

    const lastDeployedAtMs = new Date(
      currentApplication.lastDeployedAt,
    ).getTime();
    const modifiedAtMs = new Date(currentApplication.modifiedAt).getTime();

    // If modifiedAt is greater than lastDeployedAt by more than 1 second, deployment is needed
    if (modifiedAtMs - lastDeployedAtMs > 1000) {
      return REDEPLOY_TRIGGERS.PendingDeployment;
    }

    return null;
  },
);

export const getFavoriteApplicationIds = (state: DefaultRootState) =>
  state.ui.applications.favoriteApplicationIds;

export const getFavoriteApplications = createSelector(
  [getApplications, getFavoriteApplicationIds],
  (
    allApps: ApplicationPayload[] | undefined,
    favoriteIds: string[] | undefined,
  ) => {
    const apps = allApps ?? [];
    const ids = favoriteIds ?? [];
    const favoriteIdSet = new Set(ids);

    return apps
      .filter((app: ApplicationPayload) => favoriteIdSet.has(app.id))
      .sort((a: ApplicationPayload, b: ApplicationPayload) =>
        a.name.localeCompare(b.name),
      );
  },
);

export const getHasFavorites = createSelector(
  [getFavoriteApplicationIds],
  (favoriteIds: string[] | undefined) => (favoriteIds ?? []).length > 0,
);
