export * from "ce/reducers/uiReducers/workspaceReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { handlers as CE_handlers } from "ce/reducers/uiReducers/workspaceReducer";
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceUser,
} from "@appsmith/constants/workspaceConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export const initialState: WorkspaceReduxState = {
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
  groupSuggestions: [],
};

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
  groupSuggestions: { id: string; name: string }[];
}

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      permissionGroupId: string;
      permissionGroupName: string;
      userGroupId?: string;
    }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.permissionGroupId = action.payload.permissionGroupId;
        user.permissionGroupName = action.payload.permissionGroupName;
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_INIT]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.workspaceUsers = draftState.workspaceUsers.filter(
      (user: WorkspaceUser) =>
        action.payload.userGroupId
          ? user.userGroupId !== action.payload.userGroupId
          : user.username !== action.payload.username,
    );
  },
  [ReduxActionTypes.FETCH_GROUP_SUGGESTIONS_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<any>,
  ) => {
    draftState.groupSuggestions = action.payload;
  },
  [ReduxActionErrorTypes.FETCH_GROUP_SUGGESTIONS_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.groupSuggestions = [];
  },
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
