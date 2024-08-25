import { createSelector } from "reselect";
import type { AppState } from "ee/reducers";
import type { Workspace, WorkspaceRole } from "ee/constants/workspaceConstants";

export const getRolesFromState = (state: AppState) => {
  return state.ui.workspaces.roles;
};

export const getWorkspaceLoadingStates = (state: AppState) => {
  return {
    isFetchingWorkspaces:
      state.ui.workspaces.loadingStates.isFetchingWorkspaces,
    isFetchingAllRoles: state.ui.workspaces.loadingStates.isFetchAllRoles,
    isSavingWorkspaceInfo:
      state.ui.workspaces.loadingStates.isSavingWorkspaceInfo,
  };
};

export const getIsFetchingWorkspaces = (state: AppState) => {
  return state.ui.workspaces.loadingStates.isFetchingWorkspaces;
};

export const getFetchedWorkspaces = (state: AppState): Workspace[] => {
  return state.ui.workspaces.list || [];
};

export const getWorkspaceFromId = (state: AppState, workspaceId: string) => {
  const filteredWorkspaces = state.ui.workspaces.list.filter(
    (el) => el.id === workspaceId,
  );
  return !!filteredWorkspaces && filteredWorkspaces.length > 0
    ? filteredWorkspaces[0]
    : undefined;
};

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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRolesForField = createSelector(getAllRoles, (roles?: any) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const getSearchedWorkspaces = (state: AppState) =>
  state.ui.workspaces.searchEntities?.workspaces;

export const getSearchedApplications = (state: AppState) =>
  state.ui.workspaces.searchEntities?.applications;

export const getSearchedWorkflows = (state: AppState) =>
  state.ui.workspaces.searchEntities?.workflows;

export const getIsFetchingEntities = (state: AppState) => {
  return state.ui.workspaces.loadingStates.isFetchingEntities;
};

export const getIsDeletingWorkspace = (state: AppState) => {
  return state.ui.workspaces.loadingStates.isDeletingWorkspace;
};
