import { createSelector } from "reselect";
import { AppState } from "reducers";
import { OrgRole, Org, Organization } from "constants/orgConstants";

export const getRolesFromState = (state: AppState) => {
  return state.ui.orgs.roles;
};

export const getCurrentOrgId = (state: AppState) => state.ui.orgs.currentOrgId;
export const getOrgs = (state: AppState) => {
  return state.ui.applications.userOrgs;
};
export const getAllUsers = (state: AppState) => state.ui.orgs.orgUsers;
export const getAllRoles = (state: AppState) => state.ui.orgs.orgRoles;

export const getUserCurrentOrgId = (state: AppState) => {
  return state.ui.users.currentUser?.currentOrganizationId;
};

export const getCurrentOrg = createSelector(
  getOrgs,
  getCurrentOrgId,
  (orgs?: Organization[], id?: string) => {
    if (id) {
      const org = orgs?.find(org => org.organization.id === id);

      return org;
    }
  },
);

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
    };
  });
});

export const getDefaultRole = createSelector(getRoles, (roles?: OrgRole[]) => {
  return roles?.find(role => role.isDefault);
});
