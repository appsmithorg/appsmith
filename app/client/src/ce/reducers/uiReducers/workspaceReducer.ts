import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type {
  WorkspaceRole,
  Workspace,
  WorkspaceUser,
  WorkspaceUserRoles,
} from "@appsmith/constants/workspaceConstants";

export interface WorkspaceReduxState {
  list: Workspace[];
  roles?: WorkspaceRole[];
  loadingStates: {
    fetchingRoles: boolean;
    isFetchAllRoles: boolean;
    isFetchAllUsers: boolean;
    isFetchingCurrentWorkspace: boolean;
    isSavingWorkspaceInfo: boolean;
    isFetchingWorkspaces: boolean;
  };
  workspaceUsers: WorkspaceUser[];
  workspaceRoles: any;
  currentWorkspace: Workspace;
}

export const initialState: WorkspaceReduxState = {
  loadingStates: {
    fetchingRoles: false,
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingCurrentWorkspace: false,
    isSavingWorkspaceInfo: false,
    isFetchingWorkspaces: false,
  },
  list: [],
  workspaceUsers: [],
  workspaceRoles: [],
  currentWorkspace: {
    id: "",
    name: "",
  },
};

export const handlers = {
  [ReduxActionTypes.FETCH_WORKSPACE_ROLES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchAllRoles = true;
  },
  [ReduxActionTypes.FETCH_ALL_ROLES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchAllRoles = true;
  },
  [ReduxActionTypes.FETCH_ALL_USERS_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchAllUsers = true;
  },
  [ReduxActionTypes.FETCH_WORKSPACE_ROLES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<WorkspaceRole[]>,
  ) => {
    draftState.workspaceRoles = action.payload;
    draftState.loadingStates.fetchingRoles = false;
  },
  [ReduxActionErrorTypes.FETCH_WORKSPACE_ROLES_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.fetchingRoles = false;
  },
  [ReduxActionTypes.FETCH_ALL_USERS_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<WorkspaceUser[]>,
  ) => {
    draftState.workspaceUsers = action.payload;
    draftState.loadingStates.isFetchAllUsers = false;
  },
  [ReduxActionTypes.FETCH_ALL_ROLES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace[]>,
  ) => {
    draftState.workspaceRoles = action.payload;
    draftState.loadingStates.isFetchAllRoles = false;
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
    }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.roles = action.payload.roles;
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionErrorTypes.CHANGE_WORKSPACE_USER_ROLE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one role change api fails.
      user.isChangingRole = false;
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string }>,
  ) => {
    draftState.workspaceUsers = draftState.workspaceUsers.filter(
      (user: WorkspaceUser) => user.username !== action.payload.username,
    );
  },
  [ReduxActionErrorTypes.DELETE_WORKSPACE_USER_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one delete fails.
      user.isDeleting = false;
    });
  },
  [ReduxActionTypes.SET_CURRENT_WORKSPACE_ID]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ workspaceId: string }>,
  ) => {
    draftState.currentWorkspace.id = action.payload.workspaceId;
  },
  [ReduxActionTypes.SET_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.currentWorkspace = action.payload;
  },
  [ReduxActionTypes.RESET_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.currentWorkspace = {
      id: "",
      name: "",
    };
  },
  [ReduxActionTypes.FETCH_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingCurrentWorkspace = true;
  },
  [ReduxActionTypes.FETCH_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.currentWorkspace = action.payload;
    draftState.loadingStates.isFetchingCurrentWorkspace = false;
  },
  [ReduxActionErrorTypes.FETCH_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingCurrentWorkspace = false;
  },
  [ReduxActionTypes.FETCH_ALL_WORKSPACES_INIT]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingWorkspaces = true;
  },
  [ReduxActionTypes.FETCH_ALL_WORKSPACES_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace[]>,
  ) => {
    draftState.loadingStates.isFetchingWorkspaces = false;
    draftState.list = action.payload;
  },
  [ReduxActionTypes.DELETE_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<string>,
  ) => {
    draftState.list = draftState.list.filter(
      (workspace: Workspace) => workspace.id !== action.payload,
    );
  },
  [ReduxActionTypes.SAVING_WORKSPACE_INFO]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isSavingWorkspaceInfo = true;
  },
  [ReduxActionTypes.SAVE_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      id: string;
      name?: string;
      website?: string;
      email?: string;
      logoUrl?: string;
    }>,
  ) => {
    const workspaces = draftState.list;
    const workspaceIndex = draftState.list.findIndex(
      (workspace: Workspace) => workspace.id === action.payload.id,
    );

    if (workspaceIndex !== -1) {
      workspaces[workspaceIndex] = {
        ...workspaces[workspaceIndex],
        ...action.payload,
      };
    }
    draftState.loadingStates.isSavingWorkspaceInfo = false;
    draftState.list = [...workspaces];
  },
  [ReduxActionErrorTypes.SAVE_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isSavingWorkspaceInfo = false;
  },
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
