import { createImmerReducer } from "utils/ReducerUtils";
import type { ApplicationPayload } from "entities/Application";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type {
  Workspace,
  WorkspaceUser,
  WorkspaceUserRoles,
} from "ee/constants/workspaceConstants";
import type { Package } from "ee/constants/PackageConstants";
import type { UpdateApplicationRequest } from "ee/api/ApplicationApi";

export interface SelectedWorkspaceReduxState {
  workspace: Workspace;
  applications: ApplicationPayload[];
  users: WorkspaceUser[];
  packages: Package[];
  loadingStates: {
    isFetchingApplications: boolean;
    isFetchingAllUsers: boolean;
    isFetchingCurrentWorkspace: boolean;
  };
}

export const initialState: SelectedWorkspaceReduxState = {
  workspace: {
    id: "",
    name: "",
  },
  applications: [],
  users: [],
  packages: [],
  loadingStates: {
    isFetchingApplications: false,
    isFetchingAllUsers: false,
    isFetchingCurrentWorkspace: false,
  },
};

export const handlers = {
  [ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_INIT]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingApplications = true;
  },

  [ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<ApplicationPayload[]>,
  ) => {
    draftState.loadingStates.isFetchingApplications = false;
    draftState.applications = action.payload;
  },
  [ReduxActionErrorTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_ERROR]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingApplications = false;
  },
  [ReduxActionTypes.DELETE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<ApplicationPayload>,
  ) => {
    const applications = draftState.applications.filter(
      (application: ApplicationPayload) => application.id !== action.payload.id,
    );

    draftState.applications = [...applications];
  },
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      workspaceId: string;
      application: ApplicationPayload;
    }>,
  ) => {
    const applications = draftState.applications;

    applications.push(action.payload.application);
    draftState.applications = [...applications];
  },
  [ReduxActionTypes.FORK_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      workspaceId: string;
      application: ApplicationPayload;
    }>,
  ) => {
    draftState.applications = [
      ...draftState.applications,
      action.payload.application,
    ];
  },
  [ReduxActionTypes.UPDATE_APPLICATION_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<UpdateApplicationRequest>,
  ) => {
    // userWorkspaces data has to be saved to localStorage only if the action is successful
    // It introduces bug if we prematurely save it during init action.
    const { id, ...rest } = action.payload;
    const applications = draftState.applications;

    const appIndex = draftState.applications.findIndex((app) => app.id === id);

    if (appIndex !== -1) {
      applications[appIndex] = {
        ...applications[appIndex],
        ...rest,
      };
    }

    draftState.applications = [...applications];
  },
  [ReduxActionTypes.GET_ALL_USERS_OF_WORKSPACE_SUCCESS]: (
    state: SelectedWorkspaceReduxState,
    action: ReduxAction<WorkspaceUser[]>,
  ) => ({
    ...state,
    users: action.payload,
    loadingStates: {
      ...state.loadingStates,
      isFetchingAllUsers: false,
    },
  }),
  [ReduxActionTypes.INVITED_USERS_TO_WORKSPACE]: (
    state: SelectedWorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string; users: WorkspaceUser[] }>,
  ) => {
    return {
      ...state,
      users: [...state.users, ...action.payload.users],
    };
  },
  [ReduxActionTypes.FETCH_ALL_USERS_INIT]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingAllUsers = true;
  },
  [ReduxActionTypes.FETCH_ALL_USERS_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<WorkspaceUser[]>,
  ) => {
    draftState.users = action.payload;
    draftState.loadingStates.isFetchingAllUsers = false;
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_INIT]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.users = draftState.users.filter(
      (user: WorkspaceUser) => user.username !== action.payload.username,
    );
  },
  [ReduxActionErrorTypes.DELETE_WORKSPACE_USER_ERROR]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one delete fails.
      user.isDeleting = false;
    });
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
    }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.roles = action.payload.roles;
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionErrorTypes.CHANGE_WORKSPACE_USER_ROLE_ERROR]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one role change api fails.
      user.isChangingRole = false;
    });
  },
  [ReduxActionTypes.SET_CURRENT_WORKSPACE_ID]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    draftState.workspace.id = action.payload.workspaceId;
  },
  [ReduxActionTypes.SET_CURRENT_WORKSPACE]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.workspace = action.payload;
  },
  [ReduxActionTypes.RESET_CURRENT_WORKSPACE]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.workspace = {
      id: "",
      name: "",
    };
  },
  [ReduxActionTypes.FETCH_CURRENT_WORKSPACE]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingCurrentWorkspace = true;
  },
  [ReduxActionTypes.FETCH_WORKSPACE_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.workspace = action.payload;
    draftState.loadingStates.isFetchingCurrentWorkspace = false;
  },
  [ReduxActionErrorTypes.FETCH_WORKSPACE_ERROR]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingCurrentWorkspace = false;
  },
};

const selectedWorkspaceReducer = createImmerReducer(initialState, handlers);

export default selectedWorkspaceReducer;
