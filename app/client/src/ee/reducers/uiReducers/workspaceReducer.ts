export * from "ce/reducers/uiReducers/workspaceReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  handlers as CE_handlers,
  initialState as CE_initialState,
} from "ce/reducers/uiReducers/workspaceReducer";
import type { WorkspaceReduxState as CE_WorkspaceReduxState } from "ce/reducers/uiReducers/workspaceReducer";
import { ENTITY_TYPE } from "@appsmith/constants/workspaceConstants";
import type {
  WorkspaceUser,
  WorkspaceUserRoles,
} from "@appsmith/constants/workspaceConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export const initialState: WorkspaceReduxState = {
  ...CE_initialState,
  groupSuggestions: [],
};

export interface WorkspaceReduxState extends CE_WorkspaceReduxState {
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
      roles: WorkspaceUserRoles[];
      userGroupId?: string;
    }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
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
  [ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_SUCCESS]: (
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      userId: string;
      username: string;
      name: string;
      roles: WorkspaceUserRoles[];
      userGroupId?: string;
    }>,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
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
  [ReduxActionErrorTypes.CHANGE_APPLICATION_USER_ROLE_ERROR]: (
    draftState: WorkspaceReduxState,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one role change api fails.
      user.isChangingRole = false;
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
  [ReduxActionTypes.DELETE_APPLICATION_USER_INIT]: (
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
    draftState.workspaceUsers = draftState.workspaceUsers
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
    draftState: WorkspaceReduxState,
    action: ReduxAction<{
      username: string;
      userGroupId: string;
      applicationId: string;
    }>,
  ) => {
    draftState.workspaceUsers = draftState.workspaceUsers
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
    draftState: WorkspaceReduxState,
  ) => {
    draftState.workspaceUsers.forEach((user: WorkspaceUser) => {
      //TODO: This will change the status to false even if one delete fails.
      user.isDeleting = false;
    });
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
