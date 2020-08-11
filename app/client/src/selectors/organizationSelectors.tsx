import { createSelector } from "reselect";
import { AppState } from "reducers";
import { OrgRole } from "constants/orgConstants";

export const getRolesFromState = (state: AppState) => {
  return state.ui.orgs.roles;
};

export const getCurrentOrgId = (state: AppState) => state.ui.orgs.currentOrg.id;
export const getOrgs = (state: AppState) => {
  return state.ui.applications.userOrgs;
};
export const getCurrentOrg = (state: AppState) => {
  return state.ui.orgs.currentOrg;
};
export const getAllUsers = (state: AppState) => state.ui.orgs.orgUsers;
export const getAllRoles = (state: AppState) => state.ui.orgs.orgRoles;

export const getUserCurrentOrgId = (state: AppState) => {
  return state.ui.users.currentUser?.currentOrganizationId;
};

export const getRoles = createSelector(getRolesFromState, (roles?: OrgRole[]):
  | OrgRole[]
  | undefined => {
  return roles?.map(role => ({
    id: role.id,
    name: role.displayName || role.name,
    isDefault: role.isDefault,
  }));
});

export const getRolesForField = createSelector(getAllRoles, (roles?: any) => {
  return Object.entries(roles).map(role => {
    return {
      id: role[0],
      name: role[0],
      description: role[1],
    };
  });
});

export const getDefaultRole = createSelector(getRoles, (roles?: OrgRole[]) => {
  return roles?.find(role => role.isDefault);
});
