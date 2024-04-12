import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import { getIsAnvilLayoutEnabled } from "layoutSystems/anvil/integrations/selectors";
import { LayoutSystemTypes } from "layoutSystems/types";
import memoize from "micro-memoize";

export const getIsFetchingApplications = (state: AppState): boolean =>
  state.ui.selectedWorkspace.loadingStates.isFetchingApplications;

const filterApplicationsBasedOnAnvilCheck = memoize(
  (applications: ApplicationPayload[], isAnvilEnabled: boolean) => {
    return applications.filter((application) => {
      if (isAnvilEnabled) {
        return (
          application.applicationDetail?.appPositioning?.type ===
          LayoutSystemTypes.ANVIL
        );
      } else {
        return (
          application.applicationDetail?.appPositioning?.type !==
          LayoutSystemTypes.ANVIL
        );
      }
    });
  },
);

export const getApplicationsOfWorkspace = (state: AppState) => {
  const isAnvilEnabled = getIsAnvilLayoutEnabled(state);
  return filterApplicationsBasedOnAnvilCheck(
    state.ui.selectedWorkspace.applications,
    isAnvilEnabled,
  );
};

export const getAllUsersOfWorkspace = (state: AppState) =>
  state.ui.selectedWorkspace.users;

export const isFetchingUsersOfWorkspace = (state: AppState): boolean =>
  state.ui.selectedWorkspace.loadingStates.isFetchingAllUsers;

export const selectedWorkspaceLoadingStates = (state: AppState) => {
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

export const getCurrentWorkspaceId = (state: AppState) =>
  state.ui.selectedWorkspace.workspace.id;

export const getCurrentAppWorkspace = (state: AppState) => {
  return state.ui.selectedWorkspace.workspace;
};
