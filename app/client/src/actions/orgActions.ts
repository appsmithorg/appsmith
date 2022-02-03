import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { SaveOrgLogo, SaveOrgRequest } from "api/OrgApi";

export const fetchOrg = (orgId: string, skipValidation?: boolean) => {
  return {
    type: ReduxActionTypes.FETCH_CURRENT_ORG,
    payload: {
      orgId,
      skipValidation,
    },
  };
};

export const deleteOrg = (orgId: string) => {
  return {
    type: ReduxActionTypes.DELETE_ORG_INIT,
    payload: orgId,
  };
};

export const changeOrgUserRole = (
  orgId: string,
  role: string,
  username: string,
) => {
  return {
    type: ReduxActionTypes.CHANGE_ORG_USER_ROLE_INIT,
    payload: {
      orgId,
      role,
      username,
    },
  };
};

export const deleteOrgUser = (orgId: string, username: string) => {
  return {
    type: ReduxActionTypes.DELETE_ORG_USER_INIT,
    payload: {
      orgId,
      username,
    },
  };
};
export const fetchUsersForOrg = (orgId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
    payload: {
      orgId,
    },
  };
};
export const fetchRolesForOrg = (orgId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_ROLES_INIT,
    payload: {
      orgId,
    },
  };
};

export const saveOrg = (orgSettings: SaveOrgRequest) => {
  return {
    type: ReduxActionTypes.SAVE_ORG_INIT,
    payload: orgSettings,
  };
};

export const uploadOrgLogo = (orgLogo: SaveOrgLogo) => {
  return {
    type: ReduxActionTypes.UPLOAD_ORG_LOGO,
    payload: orgLogo,
  };
};

export const deleteOrgLogo = (id: string) => {
  return {
    type: ReduxActionTypes.REMOVE_ORG_LOGO,
    payload: {
      id: id,
    },
  };
};
