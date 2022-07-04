import { createSelector } from "reselect";
import { AppState } from "reducers";
import { WorkspaceRole } from "constants/workspaceConstants";

export const getRolesFromState = (state: AppState) => {
  return state.ui.workspaces.roles;
};

export const getWorkspaceLoadingStates = (state: AppState) => {
  return {
    isFetchingWorkspace: state.ui.workspaces.loadingStates.isFetchingWorkspace,
    isFetchingAllUsers: state.ui.workspaces.loadingStates.isFetchAllUsers,
    isFetchingAllRoles: state.ui.workspaces.loadingStates.isFetchAllRoles,
    deletingUserInfo: state.ui.workspaces.workspaceUsers.filter(
      (el) => el.isDeleting,
    )[0],
    roleChangingUserInfo: state.ui.workspaces.workspaceUsers.filter(
      (el) => el.isChangingRole,
    )[0],
  };
};

export const getCurrentWorkspaceId = (state: AppState) =>
  state.ui.workspaces.currentWorkspace.id;
export const getWorkspaces = (state: AppState) => {
  return state.ui.applications.userWorkspaces;
};
export const getCurrentWorkspace = (state: AppState) => {
  return state.ui.applications.userWorkspaces.map((el) => el.workspace);
};
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
  return Object.entries(roles).map((role) => {
    return {
      id: role[0],
      name: role[0],
      description: role[1],
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
