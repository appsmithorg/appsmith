import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";
export type InviteUsersToOrgByRoleValues = {
  id: string;
  users?: string;
  role?: string;
};
export type InviteUsersToOrgFormValues = {
  usersByRole: InviteUsersToOrgByRoleValues[];
};

export type CreateOrganizationFormValues = {
  name: string;
};

export const createOrganizationSubmitHandler = (
  values: CreateOrganizationFormValues,
  dispatch: any,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.CREATE_ORGANIZATION_INIT,
      payload: {
        resolve,
        reject,
        name: values.name,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};

export const inviteUsersToOrgSubmitHandler = (
  values: InviteUsersToOrgFormValues,
  dispatch: any,
): Promise<any> => {
  const data = values.usersByRole.map((value) => ({
    roleId: value.role,
    emails: value.users ? value.users.split(",") : [],
  }));
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.INVITE_USERS_TO_ORG_INIT,
      payload: {
        resolve,
        reject,
        data,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};

export const inviteUsersToOrg = (values: any, dispatch: any): Promise<any> => {
  const data = {
    roleName: values.role,
    usernames: values.users ? values.users.split(",") : [],
    orgId: values.orgId,
  };
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.INVITE_USERS_TO_ORG_INIT,
      payload: {
        resolve,
        reject,
        data,
      },
    });
  }).catch((error) => {
    throw new SubmissionError(error);
  });
};
