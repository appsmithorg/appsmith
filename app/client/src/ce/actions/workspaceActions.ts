import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  SaveWorkspaceLogo,
  SaveWorkspaceRequest,
} from "ee/api/WorkspaceApi";

interface FetchAllWorkspacesParams {
  fetchEntities?: boolean;
  workspaceId?: string | null;
}

export const fetchAllWorkspaces = (params?: FetchAllWorkspacesParams) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_WORKSPACES_INIT,
    payload: {
      fetchEntities: params?.fetchEntities,
      workspaceId: params?.workspaceId,
    },
  };
};

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

export const resetCurrentWorkspace = () => {
  return {
    type: ReduxActionTypes.RESET_CURRENT_WORKSPACE,
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
  newPermissionGroupId: string,
  username: string,
) => {
  return {
    type: ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT,
    payload: {
      workspaceId,
      newPermissionGroupId,
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

export const searchEntities = (payload: string) => ({
  type: ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_INIT,
  payload,
});

export const resetSearchEntity = () => ({
  type: ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_RESET,
});

export const fetchEntitiesOfWorkspace = (payload: { workspaceId?: string }) => {
  return {
    type: ReduxActionTypes.FETCH_ENTITIES_OF_WORKSPACE_INIT,
    payload,
  };
};

export const resetImportData = () => ({
  type: ReduxActionTypes.RESET_IMPORT_DATA,
});
