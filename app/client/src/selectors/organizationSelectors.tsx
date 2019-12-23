import { createSelector } from "reselect";
import { AppState } from "reducers";
import { OrgRole, Org } from "constants/orgConstants";
import _ from "lodash";

export const getOrgs = (state: AppState) => state.ui.orgs.list;
export const getCurrentUserOrgId = (state: AppState) =>
  state.ui.users.current?.currentOrganizationId;
export const getCurrentOrg = createSelector(
  getOrgs,
  getCurrentUserOrgId,
  (orgs?: Org[], id?: string) => {
    if (orgs && id) {
      return _.find(orgs, { id: id });
    }
    return undefined;
  },
);

export const getRoles = (state: AppState): OrgRole[] | undefined => {
  return state.ui.orgs.roles;
};
