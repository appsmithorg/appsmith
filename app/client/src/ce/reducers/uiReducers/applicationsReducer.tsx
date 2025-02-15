import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import {
  createMessage,
  ERROR_MESSAGE_CREATE_APPLICATION,
} from "ee/constants/messages";
import type {
  AppEmbedSetting,
  PageDefaultMeta,
  UpdateApplicationRequest,
} from "ee/api/ApplicationApi";
import type { CreateApplicationFormValues } from "pages/Applications/helpers";
import type { AppLayoutConfig } from "reducers/entityReducers/pageListReducer";
import type { ConnectToGitResponse } from "actions/gitSyncActions";
import type { IconNames } from "@appsmith/ads";
import type { NavigationSetting, ThemeSetting } from "constants/AppConstants";
import {
  defaultNavigationSetting,
  defaultThemeSetting,
} from "constants/AppConstants";
import { create } from "mutative";
import { isEmpty } from "lodash";
import type { ApplicationPayload } from "entities/Application";

export const initialState: ApplicationsReduxState = {
  isSavingAppName: false,
  isErrorSavingAppName: false,
  isFetchingApplication: false,
  isChangingViewAccess: false,
  applicationList: [],
  creatingApplication: {},
  deletingApplication: false,
  forkingApplication: false,
  importingApplication: false,
  importedApplication: null,
  isImportAppModalOpen: false,
  workspaceIdForImport: null,
  pageIdForImport: "",
  isAppSidebarPinned: true,
  isSavingNavigationSetting: false,
  isErrorSavingNavigationSetting: false,
  isUploadingNavigationLogo: false,
  isDeletingNavigationLogo: false,
  loadingStates: {
    isFetchingAllRoles: false,
    isFetchingAllUsers: false,
  },
  partialImportExport: {
    isExportModalOpen: false,
    isExporting: false,
    isExportDone: false,
    isImportModalOpen: false,
    isImporting: false,
    isImportDone: false,
  },
};

export const handlers = {
  [ReduxActionTypes.DELETE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, deletingApplication: true };
  },
  [ReduxActionTypes.DELETE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    // eslint-disable-next-line
    action: ReduxAction<ApplicationPayload>,
  ) => {
    return {
      ...state,
      deletingApplication: false,
    };
  },
  [ReduxActionErrorTypes.DELETE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, deletingApplication: false };
  },
  [ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isChangingViewAccess: true }),
  [ReduxActionTypes.CHANGE_APPVIEW_ACCESS_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ id: string; isPublic: boolean }>,
  ) => {
    return {
      ...state,
      isChangingViewAccess: false,
      currentApplication: {
        ...state.currentApplication,
        isPublic: action.payload.isPublic,
      },
    };
  },
  [ReduxActionTypes.FETCH_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isFetchingApplication: true }),
  [ReduxActionTypes.FETCH_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: ApplicationPayload[] }>,
  ) => {
    const newState = {
      ...state,
      currentApplication: {
        applicationDetail: {
          navigationSetting: defaultNavigationSetting,
          themeSetting: defaultThemeSetting,
        },
        ...action.payload,
      },
      isFetchingApplication: false,
    };

    if (
      !newState.currentApplication.applicationDetail.navigationSetting ||
      isEmpty(newState.currentApplication.applicationDetail.navigationSetting)
    ) {
      newState.currentApplication.applicationDetail = {
        ...newState.currentApplication.applicationDetail,
        navigationSetting: defaultNavigationSetting,
      };
    }

    return newState;
  },
  [ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ name: string; slug: string }>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      name: action.payload.name,
      slug: action.payload.slug,
    },
  }),
  [ReduxActionTypes.CURRENT_APPLICATION_ICON_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<IconNames>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      icon: action.payload,
    },
  }),
  [ReduxActionTypes.CURRENT_APPLICATION_LAYOUT_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ appLayout: AppLayoutConfig }>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      appLayout: action.payload,
    },
  }),
  [ReduxActionTypes.CREATE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
    action: ReduxAction<CreateApplicationFormValues>,
  ) => {
    const updatedCreatingApplication = { ...state.creatingApplication };

    updatedCreatingApplication[action.payload.workspaceId] = true;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
    };
  },
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{
      workspaceId: string;
      application: ApplicationPayload;
    }>,
  ) => {
    const updatedCreatingApplication = { ...state.creatingApplication };

    updatedCreatingApplication[action.payload.workspaceId] = false;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
      applicationList: [...state.applicationList, action.payload.application],
    };
  },
  [ReduxActionErrorTypes.CREATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    const updatedCreatingApplication = { ...state.creatingApplication };

    updatedCreatingApplication[action.payload.workspaceId] = false;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
      createApplicationError: createMessage(ERROR_MESSAGE_CREATE_APPLICATION),
    };
  },
  [ReduxActionTypes.FORK_APPLICATION_INIT]: (state: ApplicationsReduxState) => {
    return { ...state, forkingApplication: true };
  },
  [ReduxActionTypes.FORK_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{
      workspaceId: string;
      application: ApplicationPayload;
    }>,
  ) => {
    return {
      ...state,
      forkingApplication: false,
      applicationList: [...state.applicationList, action.payload.application],
    };
  },
  [ReduxActionErrorTypes.FORK_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      forkingApplication: false,
    };
  },
  [ReduxActionTypes.IMPORT_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    importingApplication: true,
  }),
  [ReduxActionTypes.IMPORT_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<{ importedApplication: any }>,
  ) => {
    const importedApplication = action.payload;

    return {
      ...state,
      importingApplication: false,
      importedApplication,
    };
  },
  [ReduxActionErrorTypes.IMPORT_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      importingApplication: false,
    };
  },
  [ReduxActionTypes.RESET_IMPORT_DATA]: (state: ApplicationsReduxState) => {
    return {
      ...state,
      importedApplication: null,
    };
  },
  [ReduxActionTypes.PARTIAL_IMPORT_INIT]: (state: ApplicationsReduxState) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isImporting: true,
      isImportDone: false,
    },
  }),
  [ReduxActionTypes.PARTIAL_IMPORT_SUCCESS]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isImportModalOpen: false,
      isImporting: false,
      isImportDone: true,
    },
  }),
  [ReduxActionErrorTypes.PARTIAL_IMPORT_ERROR]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isImportModalOpen: false,
      isImporting: false,
      isImportDone: true,
    },
  }),
  [ReduxActionTypes.SEARCH_APPLICATIONS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ keyword?: string }>,
  ) => {
    return {
      ...state,
      searchKeyword: action.payload.keyword,
    };
  },
  [ReduxActionTypes.UPDATE_APPLICATION]: (
    state: ApplicationsReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    let isSavingAppName = false;
    let isSavingNavigationSetting = false;

    if (action.payload.name) {
      isSavingAppName = true;
    }

    if (action.payload.applicationDetail?.navigationSetting) {
      isSavingNavigationSetting = true;
    }

    return {
      ...state,
      isSavingAppName,
      isErrorSavingAppName: false,
      isSavingNavigationSetting,
      isErrorSavingNavigationSetting: false,
      ...(action.payload.applicationDetail
        ? {
            applicationDetail: {
              ...state.currentApplication?.applicationDetail,
              ...action.payload.applicationDetail,
            },
          }
        : {}),
    };
  },
  [ReduxActionTypes.UPDATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    // eslint-disable-next-line
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    // userWorkspaces data has to be saved to localStorage only if the action is successful
    // It introduces bug if we prematurely save it during init action.
    return {
      ...state,
      isSavingAppName: false,
      isErrorSavingAppName: false,
      isSavingNavigationSetting: false,
      isErrorSavingNavigationSetting: false,
    };
  },
  [ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      isSavingAppName: false,
      isErrorSavingAppName: true,
      isSavingNavigationSetting: false,
      isErrorSavingNavigationSetting: true,
    };
  },
  [ReduxActionTypes.RESET_CURRENT_APPLICATION]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    currentApplication: null,
  }),
  [ReduxActionTypes.CONNECT_TO_GIT_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ConnectToGitResponse>,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        gitApplicationMetadata: action.payload.gitApplicationMetadata,
      },
    };
  },
  [ReduxActionTypes.UPDATE_BRANCH_LOCALLY]: (
    state: ApplicationsReduxState,
    action: ReduxAction<string>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      gitApplicationMetadata: {
        ...(state.currentApplication?.gitApplicationMetadata || {}),
        branchName: action.payload,
      },
    },
  }), // updating default branch when git sync on branch list
  [ReduxActionTypes.FETCH_BRANCHES_SUCCESS]: (
    state: ApplicationsReduxState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any[]>,
  ) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultBranch = action.payload.find((branch: any) => branch.default);

    if (defaultBranch) {
      return {
        ...state,
        currentApplication: {
          ...state.currentApplication,
          gitApplicationMetadata: {
            ...(state.currentApplication?.gitApplicationMetadata || {}),
            defaultBranchName: defaultBranch.branchName,
          },
        },
      };
    }

    return state;
  },
  [ReduxActionTypes.INIT_DATASOURCE_CONNECTION_DURING_IMPORT_SUCCESS]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    isDatasourceConfigForImportFetched: true,
  }),
  [ReduxActionTypes.RESET_DATASOURCE_CONFIG_FETCHED_FOR_IMPORT_FLAG]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    isDatasourceConfigForImportFetched: false,
  }),
  [ReduxActionTypes.SET_WORKSPACE_ID_FOR_IMPORT]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    return {
      ...state,
      workspaceIdForImport: action.payload.workspaceId,
    };
  },
  [ReduxActionTypes.SET_PAGE_ID_FOR_IMPORT]: (
    state: ApplicationsReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      pageIdForImport: action.payload,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    return {
      ...state,
      applicationList: [...state.applicationList, action.payload],
    };
  },
  [ReduxActionTypes.CURRENT_APPLICATION_EMBED_SETTING_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<AppEmbedSetting>,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        embedSetting: action.payload,
      },
    };
  },
  [ReduxActionTypes.CURRENT_APPLICATION_FORKING_ENABLED_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        forkingEnabled: action.payload,
      },
    };
  },
  [ReduxActionTypes.UPDATE_NAVIGATION_SETTING]: (
    state: ApplicationsReduxState,
    action: ReduxAction<NavigationSetting>,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        applicationDetail: {
          ...state.currentApplication?.applicationDetail,
          navigationSetting: {
            ...defaultNavigationSetting,
            ...action.payload,
          },
        },
      },
    };
  },
  [ReduxActionTypes.UPDATE_THEME_SETTING]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ThemeSetting>,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        applicationDetail: {
          ...state.currentApplication?.applicationDetail,
          themeSetting: {
            ...defaultThemeSetting,
            ...action.payload,
          },
        },
      },
    };
  },
  [ReduxActionTypes.SET_APP_SIDEBAR_PINNED]: (
    state: ApplicationsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isAppSidebarPinned: action.payload,
  }),
  [ReduxActionTypes.UPLOAD_NAVIGATION_LOGO_INIT]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    isUploadingNavigationLogo: true,
  }),
  [ReduxActionTypes.UPLOAD_NAVIGATION_LOGO_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<NavigationSetting["logoAssetId"]>,
  ) => {
    return create(state, (draftState: ApplicationsReduxState) => {
      draftState.isUploadingNavigationLogo = false;

      if (
        draftState?.currentApplication?.applicationDetail?.navigationSetting
      ) {
        draftState.currentApplication.applicationDetail.navigationSetting.logoAssetId =
          action.payload;
      }
    });
  },
  [ReduxActionErrorTypes.UPLOAD_NAVIGATION_LOGO_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      isUploadingNavigationLogo: false,
    };
  },
  [ReduxActionTypes.DELETE_NAVIGATION_LOGO_INIT]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    isDeletingNavigationLogo: true,
  }),
  [ReduxActionTypes.DELETE_NAVIGATION_LOGO_SUCCESS]: (
    state: ApplicationsReduxState,
  ) => {
    const updatedNavigationSetting = Object.assign(
      {},
      state.currentApplication?.applicationDetail?.navigationSetting,
      {
        logoAssetId: "",
      },
    );

    const updatedApplicationDetail = Object.assign(
      {},
      state.currentApplication?.applicationDetail,
      {
        navigationSetting: updatedNavigationSetting,
      },
    );

    const updatedCurrentApplication = Object.assign(
      {},
      state.currentApplication,
      {
        applicationDetail: updatedApplicationDetail,
      },
    );

    return Object.assign({}, state, {
      isDeletingNavigationLogo: false,
      currentApplication: updatedCurrentApplication,
    });
  },
  [ReduxActionErrorTypes.DELETE_NAVIGATION_LOGO_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      isDeletingNavigationLogo: false,
    };
  },
  [ReduxActionTypes.CURRENT_APPLICATION_COMMUNITY_TEMPLATE_STATUS_UPDATE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{
      isCommunityTemplate: boolean;
      forkingEnabled: boolean;
      isPublic: boolean;
    }>,
  ) => ({
    ...state,
    currentApplication: {
      ...state.currentApplication,
      isCommunityTemplate: action.payload.isCommunityTemplate,
      isPublic: action.payload.isPublic,
      forkingEnabled: action.payload.forkingEnabled,
    },
  }),
  [ReduxActionTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        isPublishingAppToCommunityTemplate: true,
      },
    };
  },
  [ReduxActionTypes.SET_PUBLISHED_APP_TO_COMMUNITY_PORTAL]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        publishedAppToCommunityTemplate: false,
      },
    };
  },
  [ReduxActionTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_SUCCESS]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        isPublishingAppToCommunityTemplate: false,
        publishedAppToCommunityTemplate: true,
      },
    };
  },
  [ReduxActionErrorTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      currentApplication: {
        ...state.currentApplication,
        isPublishingAppToCommunityTemplate: false,
      },
    };
  },
  [ReduxActionTypes.SET_CURRENT_APPLICATION_ID_FOR_CREATE_NEW_APP]: (
    state: ApplicationsReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      currentApplicationIdForCreateNewApp: action.payload,
    };
  },
  [ReduxActionTypes.RESET_CURRENT_APPLICATION_ID_FOR_CREATE_NEW_APP]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      currentApplicationIdForCreateNewApp: undefined,
    };
  },
  [ReduxActionTypes.PARTIAL_IMPORT_MODAL_OPEN]: (
    state: ApplicationsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isImportModalOpen: action.payload,
    },
  }),
  [ReduxActionTypes.PARTIAL_EXPORT_MODAL_OPEN]: (
    state: ApplicationsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isExportModalOpen: action.payload,
    },
  }),
  [ReduxActionTypes.PARTIAL_EXPORT_INIT]: (state: ApplicationsReduxState) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isExporting: true,
      isExportDone: false,
    },
  }),
  [ReduxActionTypes.PARTIAL_EXPORT_SUCCESS]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isExportModalOpen: false,
      isExporting: false,
      isExportDone: true,
    },
  }),
  [ReduxActionErrorTypes.PARTIAL_EXPORT_ERROR]: (
    state: ApplicationsReduxState,
  ) => ({
    ...state,
    partialImportExport: {
      ...state.partialImportExport,
      isExportModalOpen: false,
      isExporting: false,
      isExportDone: true,
    },
  }),
  [ReduxActionTypes.SET_CURRENT_PLUGIN_ID_FOR_CREATE_NEW_APP]: (
    state: ApplicationsReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      currentPluginIdForCreateNewApp: action.payload,
    };
  },
  [ReduxActionTypes.RESET_CURRENT_PLUGIN_ID_FOR_CREATE_NEW_APP]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      currentPluginIdForCreateNewApp: undefined,
    };
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: (state: ApplicationsReduxState) => {
    return {
      ...state,
      isSavingNavigationSetting: false,
    };
  },
};

const applicationsReducer = createReducer(initialState, handlers);

export type creatingApplicationMap = Record<string, boolean>;

export interface ApplicationsReduxState {
  applicationList: ApplicationPayload[];
  searchKeyword?: string;
  isSavingAppName: boolean;
  isErrorSavingAppName: boolean;
  isFetchingApplication: boolean;
  isChangingViewAccess: boolean;
  creatingApplication: creatingApplicationMap;
  createApplicationError?: string;
  deletingApplication: boolean;
  forkingApplication: boolean;
  currentApplication?: ApplicationPayload;
  importingApplication: boolean;
  importedApplication: unknown;
  isImportAppModalOpen: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspaceIdForImport: any;
  pageIdForImport: string;
  isDatasourceConfigForImportFetched?: boolean;
  isAppSidebarPinned: boolean;
  isSavingNavigationSetting: boolean;
  isErrorSavingNavigationSetting: boolean;
  isUploadingNavigationLogo: boolean;
  isDeletingNavigationLogo: boolean;
  loadingStates: {
    isFetchingAllRoles: boolean;
    isFetchingAllUsers: boolean;
  };
  currentApplicationIdForCreateNewApp?: string;
  partialImportExport: {
    isExportModalOpen: boolean;
    isExporting: boolean;
    isExportDone: boolean;
    isImportModalOpen: boolean;
    isImporting: boolean;
    isImportDone: boolean;
  };
  currentPluginIdForCreateNewApp?: string;
}

export interface Application {
  id: string;
  baseId: string;
  name: string;
  workspaceId: string;
  isPublic: boolean;
  appIsExample: boolean;
  new: boolean;
  defaultPageId: string;
  pages: PageDefaultMeta[];
  userPermissions: string[];
}

export default applicationsReducer;
