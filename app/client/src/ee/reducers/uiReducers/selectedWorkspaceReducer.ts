export * from "ce/reducers/uiReducers/selectedWorkspaceReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { WorkspaceUser } from "@appsmith/constants/workspaceConstants";
import type { WorkspaceUserRoles } from "@appsmith/constants/workspaceConstants";
import type { SelectedWorkspaceReduxState } from "@appsmith/reducers/uiReducers/selectedWorkspaceReducer";
import {
  handlers as CE_handlers,
  initialState,
} from "ce/reducers/uiReducers/selectedWorkspaceReducer";
import { createImmerReducer } from "utils/ReducerUtils";
import { ENTITY_TYPE } from "@appsmith/constants/workspaceConstants";

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
      userGroupId?: string;
    }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.roles = user.roles.map((ur: any) => {
          if (
            ur.entityType === action.payload.roles[0]?.entityType &&
            ur.entityId === action.payload.roles[0]?.entityId
          ) {
            return action.payload.roles[0];
          } else {
            return ur;
          }
        });
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
      userGroupId?: string;
    }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.roles = user.roles.map((ur: any) => {
          if (
            ur.entityType === action.payload.roles[0]?.entityType &&
            ur.entityId === action.payload.roles[0]?.entityId
          ) {
            return {
              ...ur,
              ...action.payload.roles[0],
            };
          } else {
            return ur;
          }
        });
        user.isChangingRole = false;
      }
    });
  },
  [ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_INIT]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isChangingRole = true;
      }
    });
  },
  [ReduxActionErrorTypes.CHANGE_APPLICATION_USER_ROLE_ERROR]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one role change api fails.
      user.isChangingRole = false;
    });
  },
  [ReduxActionTypes.DELETE_WORKSPACE_USER_INIT]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      if (
        action.payload.userGroupId
          ? user.userGroupId === action.payload.userGroupId
          : user.username === action.payload.username
      ) {
        user.isDeleting = true;
      }
    });
  },
  [ReduxActionTypes.DELETE_APPLICATION_USER_INIT]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
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
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{ username: string; userGroupId: string }>,
  ) => {
    draftState.users = draftState.users
      .map((user: WorkspaceUser) => {
        if (
          action.payload.userGroupId
            ? user.userGroupId === action.payload.userGroupId
            : user.username === action.payload.username
        ) {
          if (user.roles.length === 1) {
            user.roles = [];
          } else {
            user.roles[0] = {
              entityType: ENTITY_TYPE.WORKSPACE,
              autoCreated: false,
            };
          }
        }
        user.isDeleting = false;
        return user;
      })
      .filter((user: WorkspaceUser) => user.roles.length !== 0);
  },
  [ReduxActionTypes.DELETE_APPLICATION_USER_SUCCESS]: (
    draftState: SelectedWorkspaceReduxState,
    action: ReduxAction<{
      username: string;
      userGroupId: string;
      applicationId: string;
    }>,
  ) => {
    draftState.users = draftState.users
      .map((user: WorkspaceUser) => {
        if (
          action.payload.userGroupId
            ? user.userGroupId === action.payload.userGroupId
            : user.username === action.payload.username
        ) {
          user.roles = user.roles.filter(
            (ur: any) => ur.entityId !== action.payload.applicationId,
          );
          if (
            user.roles.length === 1 &&
            user.roles[0].entityType === ENTITY_TYPE.WORKSPACE &&
            !user.roles[0].name
          ) {
            user.roles = [];
          }
        }
        user.isDeleting = false;
        return user;
      })
      .filter((user: WorkspaceUser) => user.roles.length !== 0);
  },
  [ReduxActionErrorTypes.DELETE_APPLICATION_USER_ERROR]: (
    draftState: SelectedWorkspaceReduxState,
  ) => {
    draftState.users.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one delete fails.
      user.isDeleting = false;
    });
  },
};

const selectedWorkspaceReducer = createImmerReducer(initialState, handlers);

export default selectedWorkspaceReducer;
