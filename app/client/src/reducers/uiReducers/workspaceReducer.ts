import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  WorkspaceRole,
  Workspace,
  WorkspaceUser,
} from "constants/workspaceConstants";

const initialState: WorkspaceReduxState = {
  loadingStates: {
    fetchingRoles: false,
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingWorkspace: false,
  },
  workspaceUsers: [],
  workspaceRoles: [],
  currentWorkspace: {
    id: "",
    name: "",
  },
};

const workspaceReducer = createImmerReducer(initialState, {
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
    action: ReduxAction<{ username: string; roleName: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (user.username === action.payload.username) {
        user.roleName = action.payload.roleName;
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
  [ReduxActionTypes.FETCH_CURRENT_WORKSPACE]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingWorkspace = true;
  },
  [ReduxActionTypes.FETCH_WORKSPACE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<Workspace>,
  ) => {
    draftState.currentWorkspace = action.payload;
    draftState.loadingStates.isFetchingWorkspace = false;
  },
  [ReduxActionErrorTypes.FETCH_WORKSPACE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.loadingStates.isFetchingWorkspace = false;
  },
});

export interface WorkspaceReduxState {
  list?: Workspace[];
  roles?: WorkspaceRole[];
  loadingStates: {
    fetchingRoles: boolean;
    isFetchAllRoles: boolean;
    isFetchAllUsers: boolean;
    isFetchingWorkspace: boolean;
  };
  workspaceUsers: WorkspaceUser[];
  workspaceRoles: any;
  currentWorkspace: Workspace;
}

export default workspaceReducer;
