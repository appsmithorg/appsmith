export * from "ce/selectors/applicationSelectors";
import type { AppState } from "@appsmith/reducers";
import type { WorkspaceUserRoles } from "@appsmith/constants/workspaceConstants";
import { createSelector } from "reselect";

export const getAllAppUsers = (state: AppState) =>
  state.ui.applications.applicationUsers;

export const getAllAppRoles = (state: AppState) =>
  state.ui.applications.applicationRoles;

export const getAppRolesForField = createSelector(
  getAllAppRoles,
  (roles: WorkspaceUserRoles[] = []) => {
    return roles.map((role: any) => {
      return {
        id: role?.id,
        name: role?.name,
        description: role?.description,
      };
    });
  },
);
