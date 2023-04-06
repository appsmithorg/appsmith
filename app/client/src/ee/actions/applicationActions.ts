export * from "ce/actions/applicationActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchUsersForApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_APP_USERS_INIT,
    payload: {
      applicationId,
    },
  };
};

export const fetchRolesForApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.FETCH_ALL_APP_ROLES_INIT,
    payload: {
      applicationId,
    },
  };
};

export const fetchDefaultRolesForApplication = () => {
  return {
    type: ReduxActionTypes.FETCH_APP_DEFAULT_ROLES_INIT,
  };
};

export const deleteApplicationUser = (
  applicationId: string,
  username: string,
  userGroupId?: string,
) => {
  return {
    type: ReduxActionTypes.DELETE_APPLICATION_USER_INIT,
    payload: {
      applicationId,
      username,
      userGroupId,
    },
  };
};

export const changeApplicationUserRole = (
  applicationId: string,
  newRole: string,
  username: string,
  userGroupId: string,
) => {
  return {
    type: ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_INIT,
    payload: {
      applicationId,
      username,
      userGroupId,
      newRole,
    },
  };
};
