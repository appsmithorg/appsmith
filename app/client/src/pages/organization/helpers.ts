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

export const inviteUsersToOrgSubmitHandler = (
  values: InviteUsersToOrgFormValues,
  dispatch: any,
): Promise<any> => {
  const data = values.usersByRole.map(value => ({
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
  }).catch(error => {
    throw new SubmissionError(error);
  });
};
