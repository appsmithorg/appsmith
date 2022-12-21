export * from "ce/actions/workspaceActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const changeWorkspaceUserRole = (
  workspaceId: string,
  newPermissionGroupId: string,
  username: string,
  userGroupId?: string,
) => {
  return {
    type: ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT,
    payload: {
      workspaceId,
      newPermissionGroupId,
      username,
      userGroupId,
    },
  };
};

export const deleteWorkspaceUser = (
  workspaceId: string,
  username: string,
  userGroupId?: string,
) => {
  return {
    type: ReduxActionTypes.DELETE_WORKSPACE_USER_INIT,
    payload: {
      workspaceId,
      username,
      userGroupId,
    },
  };
};
