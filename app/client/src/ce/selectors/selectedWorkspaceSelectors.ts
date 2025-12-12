import type { DefaultRootState } from "react-redux";

export const getIsFetchingApplications = (state: DefaultRootState): boolean =>
  state.ui.selectedWorkspace.loadingStates.isFetchingApplications;

export const getApplicationsOfWorkspace = (state: DefaultRootState) => {
  const applications = state.ui.selectedWorkspace.applications;
  const favoriteApplicationIds =
    state.ui.applications.favoriteApplicationIds || [];

  // Compute isFavorited for each application based on favoriteApplicationIds
  // This ensures favorites persist when switching between workspaces
  return applications.map((app) => ({
    ...app,
    isFavorited: favoriteApplicationIds.includes(app.id),
  }));
};

export const getAllUsersOfWorkspace = (state: DefaultRootState) =>
  state.ui.selectedWorkspace.users;

export const isFetchingUsersOfWorkspace = (state: DefaultRootState): boolean =>
  state.ui.selectedWorkspace.loadingStates.isFetchingAllUsers;

export const selectedWorkspaceLoadingStates = (state: DefaultRootState) => {
  return {
    isFetchingApplications:
      state.ui.selectedWorkspace.loadingStates.isFetchingApplications,
    isFetchingAllUsers:
      state.ui.selectedWorkspace.loadingStates.isFetchingAllUsers,
    isFetchingCurrentWorkspace:
      state.ui.selectedWorkspace.loadingStates.isFetchingCurrentWorkspace,
    deletingUserInfo: state.ui.selectedWorkspace.users.filter(
      (el) => el.isDeleting,
    )[0],
    roleChangingUserInfo: state.ui.selectedWorkspace.users.filter(
      (el) => el.isChangingRole,
    )[0],
  };
};

export const getCurrentWorkspaceId = (state: DefaultRootState) =>
  state.ui.selectedWorkspace.workspace.id;

export const getCurrentAppWorkspace = (state: DefaultRootState) => {
  return state.ui.selectedWorkspace.workspace;
};
