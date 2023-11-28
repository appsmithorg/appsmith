import { createSelector } from "reselect";
import type { AppState } from "@appsmith/reducers";
import type {
  Workspace,
  WorkspaceRole,
} from "@appsmith/constants/workspaceConstants";

export const getRolesFromState = (state: AppState) => {
  return state.ui.workspaces.roles;
};

export const getWorkspaceLoadingStates = (state: AppState) => {
  return {
    isFetchingCurrentWorkspace:
      state.ui.workspaces.loadingStates.isFetchingCurrentWorkspace,
    isFetchingWorkspaces:
      state.ui.workspaces.loadingStates.isFetchingWorkspaces,
    isFetchingAllUsers: state.ui.workspaces.loadingStates.isFetchAllUsers,
    isFetchingAllRoles: state.ui.workspaces.loadingStates.isFetchAllRoles,
    isSavingWorkspaceInfo:
      state.ui.workspaces.loadingStates.isSavingWorkspaceInfo,
    deletingUserInfo: state.ui.workspaces.workspaceUsers.filter(
      (el) => el.isDeleting,
    )[0],
    roleChangingUserInfo: state.ui.workspaces.workspaceUsers.filter(
      (el) => el.isChangingRole,
    )[0],
  };
};

export const getIsFetchingWorkspaces = (state: AppState) => {
  return state.ui.workspaces.loadingStates.isFetchingWorkspaces;
};

export const getFetchedWorkspaces = (state: AppState): Workspace[] => {
  return state.ui.workspaces.list || [];
};

export const getCurrentWorkspaceId = (state: AppState) =>
  state.ui.workspaces.currentWorkspace.id;

export const getWorkspaceFromId = (state: AppState, workspaceId: string) => {
  const filteredWorkspaces = state.ui.workspaces.list.filter(
    (el) => el.id === workspaceId,
  );
  return !!filteredWorkspaces && filteredWorkspaces.length > 0
    ? filteredWorkspaces[0]
    : undefined;
};

export const getCurrentWorkspace = createSelector(
  getFetchedWorkspaces,
  getCurrentWorkspaceId,
  (fetchedWorkspaces: Workspace[], currentWorkspaceId: string) => {
    if (fetchedWorkspaces && currentWorkspaceId) {
      return fetchedWorkspaces.find(
        (workspace: Workspace) => workspace.id === currentWorkspaceId,
      );
    }
  },
);

export const getCurrentAppWorkspace = (state: AppState) => {
  return state.ui.workspaces.currentWorkspace;
};

export const getAllUsers = (state: AppState) =>
  state.ui.workspaces.workspaceUsers;

export const getAllRoles = (state: AppState) =>
  state.ui.workspaces.workspaceRoles;

export const getRoles = createSelector(
  getRolesFromState,
  (roles?: WorkspaceRole[]): WorkspaceRole[] | undefined => {
    return roles?.map((role) => ({
      id: role.id,
      name: role.displayName || role.name,
      isDefault: role.isDefault,
    }));
  },
);

export const getRolesForField = createSelector(getAllRoles, (roles?: any) => {
  return roles.map((role: any) => {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
  });
});

export const getDefaultRole = createSelector(
  getRoles,
  (roles?: WorkspaceRole[]) => {
    return roles?.find((role) => role.isDefault);
  },
);

export const getCurrentError = (state: AppState) => {
  return state.ui.errors.currentError;
};

export const getIsSavingWorkspaceInfo = (state: AppState) =>
  state.ui.workspaces.loadingStates.isSavingWorkspaceInfo;
