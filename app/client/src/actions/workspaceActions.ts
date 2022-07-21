import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SaveWorkspaceLogo, SaveWorkspaceRequest } from "api/WorkspaceApi";

export const fetchWorkspace = (
  workspaceId: string,
  skipValidation?: boolean,
) => {
  return {
    type: ReduxActionTypes.FETCH_CURRENT_WORKSPACE,
    payload: {
      workspaceId,
      skipValidation,
    },
  };
};

export const deleteWorkspace = (workspaceId: string) => {
  return {
    type: ReduxActionTypes.DELETE_WORKSPACE_INIT,
    payload: workspaceId,
  };
};

export const changeWorkspaceUserRole = (
  workspaceId: string,
  role: string,
  username: string,
) => {
  return {
    type: ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT,
    payload: {
      workspaceId,
      role,
      username,
    },
  };
};

export const deleteWorkspaceUser = (workspaceId: string, username: string) => {
  return {
    type: ReduxActionTypes.DELETE_WORKSPACE_USER_INIT,
    payload: {
      workspaceId,
      username,
    },
  };
};
export const fetchUsersForWorkspace = (workspaceId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
    payload: {
      workspaceId,
    },
  };
};
export const fetchRolesForWorkspace = (workspaceId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
    payload: {
      workspaceId,
    },
  };
};

export const saveWorkspace = (workspaceSettings: SaveWorkspaceRequest) => {
  return {
    type: ReduxActionTypes.SAVE_WORKSPACE_INIT,
    payload: workspaceSettings,
  };
};

export const uploadWorkspaceLogo = (workspaceLogo: SaveWorkspaceLogo) => {
  return {
    type: ReduxActionTypes.UPLOAD_WORKSPACE_LOGO,
    payload: workspaceLogo,
  };
};

export const deleteWorkspaceLogo = (id: string) => {
  return {
    type: ReduxActionTypes.REMOVE_WORKSPACE_LOGO,
    payload: {
      id: id,
    },
  };
};
