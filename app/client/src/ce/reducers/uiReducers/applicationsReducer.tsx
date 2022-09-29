import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ApplicationPayload,
} from "@appsmith/constants/ReduxActionConstants";
import { Workspaces, WorkspaceUser } from "constants/workspaceConstants";
import {
  createMessage,
  ERROR_MESSAGE_CREATE_APPLICATION,
} from "@appsmith/constants/messages";
import { UpdateApplicationRequest } from "api/ApplicationApi";
import { CreateApplicationFormValues } from "pages/Applications/helpers";
import { AppLayoutConfig } from "reducers/entityReducers/pageListReducer";
import { ConnectToGitResponse } from "actions/gitSyncActions";

export const initialState: ApplicationsReduxState = {
  isFetchingApplications: false,
  isSavingAppName: false,
  isErrorSavingAppName: false,
  isFetchingApplication: false,
  isChangingViewAccess: false,
  applicationList: [],
  creatingApplication: {},
  deletingApplication: false,
  forkingApplication: false,
  duplicatingApplication: false,
  userWorkspaces: [],
  isSavingWorkspaceInfo: false,
  importingApplication: false,
  importedApplication: null,
  showAppInviteUsersDialog: false,
  isImportAppModalOpen: false,
  workspaceIdForImport: null,
};

export const handlers = {
  [ReduxActionTypes.DELETE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, deletingApplication: true };
  },
  [ReduxActionTypes.DELETE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      if (workspace.workspace.id === action.payload.workspaceId) {
        let applications = workspace.applications;

        applications = applications.filter(
          (application: ApplicationPayload) => {
            return application.id !== action.payload.id;
          },
        );

        return {
          ...workspace,
          applications,
        };
      }

      return workspace;
    });

    return {
      ...state,
      userWorkspaces: _workspaces,
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
  [ReduxActionTypes.GET_ALL_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isFetchingApplications: true }),
  [ReduxActionTypes.FETCH_USER_APPLICATIONS_WORKSPACES_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: any }>,
  ) => {
    return {
      ...state,
      isFetchingApplications: false,
      userWorkspaces: action.payload,
    };
  },
  [ReduxActionTypes.DELETE_WORKSPACE_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      userWorkspaces: state.userWorkspaces.filter(
        (workspace: Workspaces) => workspace.workspace.id !== action.payload,
      ),
    };
  },
  [ReduxActionTypes.FETCH_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, isFetchingApplication: true }),
  [ReduxActionTypes.FETCH_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ applicationList: ApplicationPayload[] }>,
  ) => ({
    ...state,
    currentApplication: action.payload,
    isFetchingApplication: false,
  }),
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
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      if (workspace.workspace.id === action.payload.workspaceId) {
        const applications = workspace.applications;
        applications.push(action.payload.application);
        workspace.applications = [...applications];
        return {
          ...workspace,
        };
      }
      return workspace;
    });

    const updatedCreatingApplication = { ...state.creatingApplication };
    updatedCreatingApplication[action.payload.workspaceId] = false;

    return {
      ...state,
      creatingApplication: updatedCreatingApplication,
      applicationList: [...state.applicationList, action.payload.application],
      userWorkspaces: _workspaces,
    };
  },
  [ReduxActionTypes.INVITED_USERS_TO_WORKSPACE]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ workspaceId: string; users: WorkspaceUser[] }>,
  ) => {
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      if (workspace.workspace.id === action.payload.workspaceId) {
        const users = workspace.users;
        workspace.users = [...users, ...action.payload.users];
        return {
          ...workspace,
        };
      }
      return workspace;
    });

    return {
      ...state,
      userWorkspaces: _workspaces,
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
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      if (workspace.workspace.id === action.payload.workspaceId) {
        const applications = workspace.applications;
        workspace.applications = [...applications, action.payload.application];
        return {
          ...workspace,
        };
      }
      return workspace;
    });

    return {
      ...state,
      forkingApplication: false,
      applicationList: [...state.applicationList, action.payload.application],
      userWorkspaces: _workspaces,
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
  [ReduxActionTypes.SAVING_WORKSPACE_INFO]: (state: ApplicationsReduxState) => {
    return {
      ...state,
      isSavingWorkspaceInfo: true,
    };
  },
  [ReduxActionTypes.SAVE_WORKSPACE_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{
      id: string;
      name?: string;
      website?: string;
      email?: string;
      logoUrl?: string;
    }>,
  ) => {
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      if (workspace.workspace.id === action.payload.id) {
        workspace.workspace = { ...workspace.workspace, ...action.payload };

        return {
          ...workspace,
        };
      }
      return workspace;
    });

    return {
      ...state,
      userWorkspaces: _workspaces,
      isSavingWorkspaceInfo: false,
    };
  },
  [ReduxActionErrorTypes.SAVE_WORKSPACE_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return {
      ...state,
      isSavingWorkspaceInfo: false,
    };
  },
  [ReduxActionTypes.SEARCH_APPLICATIONS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<{ keyword?: string }>,
  ) => {
    return {
      ...state,
      searchKeyword: action.payload.keyword,
    };
  },
  [ReduxActionTypes.DUPLICATE_APPLICATION_INIT]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, duplicatingApplication: true };
  },
  [ReduxActionTypes.DUPLICATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    return {
      ...state,
      duplicatingApplication: false,
      applicationList: [...state.applicationList, action.payload],
    };
  },
  [ReduxActionErrorTypes.DUPLICATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, duplicatingApplication: false };
  },
  [ReduxActionTypes.UPDATE_APPLICATION]: (
    state: ApplicationsReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    let isSavingAppName = false;
    if (action.payload.name) {
      isSavingAppName = true;
    }
    return {
      ...state,
      isSavingAppName: isSavingAppName,
      isErrorSavingAppName: false,
    };
  },
  [ReduxActionTypes.UPDATE_APPLICATION_SUCCESS]: (
    state: ApplicationsReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    // userWorkspaces data has to be saved to localStorage only if the action is successful
    // It introduces bug if we prematurely save it during init action.
    const { id, ...rest } = action.payload;
    const _workspaces = state.userWorkspaces.map((workspace: Workspaces) => {
      const appIndex = workspace.applications.findIndex((app) => app.id === id);

      if (appIndex !== -1) {
        workspace.applications[appIndex] = {
          ...workspace.applications[appIndex],
          ...rest,
        };
      }

      return workspace;
    });
    return {
      ...state,
      userWorkspaces: _workspaces,
      isSavingAppName: false,
      isErrorSavingAppName: false,
    };
  },
  [ReduxActionErrorTypes.UPDATE_APPLICATION_ERROR]: (
    state: ApplicationsReduxState,
  ) => {
    return { ...state, isSavingAppName: false, isErrorSavingAppName: true };
  },
  [ReduxActionTypes.RESET_CURRENT_APPLICATION]: (
    state: ApplicationsReduxState,
  ) => ({ ...state, currentApplication: null }),
  [ReduxActionTypes.SET_SHOW_APP_INVITE_USERS_MODAL]: (
    state: ApplicationsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    showAppInviteUsersDialog: action.payload,
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
    action: ReduxAction<any[]>,
  ) => {
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
    action: ReduxAction<string>,
  ) => {
    let currentApplication = state.currentApplication;
    if (action.payload) {
      currentApplication = undefined;
    }

    return {
      ...state,
      currentApplication,
      workspaceIdForImport: action.payload,
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
};

const applicationsReducer = createReducer(initialState, handlers);

export type creatingApplicationMap = Record<string, boolean>;

export interface ApplicationsReduxState {
  applicationList: ApplicationPayload[];
  searchKeyword?: string;
  isFetchingApplications: boolean;
  isSavingAppName: boolean;
  isErrorSavingAppName: boolean;
  isFetchingApplication: boolean;
  isChangingViewAccess: boolean;
  creatingApplication: creatingApplicationMap;
  createApplicationError?: string;
  deletingApplication: boolean;
  forkingApplication: boolean;
  duplicatingApplication: boolean;
  currentApplication?: ApplicationPayload;
  userWorkspaces: Workspaces[];
  isSavingWorkspaceInfo: boolean;
  importingApplication: boolean;
  showAppInviteUsersDialog: boolean;
  importedApplication: unknown;
  isImportAppModalOpen: boolean;
  workspaceIdForImport: any;
  isDatasourceConfigForImportFetched?: boolean;
}

export interface Application {
  id: string;
  name: string;
  workspaceId: string;
  isPublic: boolean;
  appIsExample: boolean;
  new: boolean;
  defaultPageId: string;
  pages: Array<{ id: string; isDefault: boolean; default: boolean }>;
  userPermissions: string[];
}

export default applicationsReducer;
