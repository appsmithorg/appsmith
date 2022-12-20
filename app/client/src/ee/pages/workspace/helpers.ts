export * from "ce/pages/workspace/helpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";

export const inviteUsersToWorkspace = (
  values: any,
  dispatch: any,
): Promise<any> => {
  const data = {
    permissionGroupId: values.permissionGroupId,
    usernames: values.users ? values.users.split(",") : [],
    groups: values.groups ? values.groups.split(",") : [],
    workspaceId: values.workspaceId,
  };
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.INVITE_USERS_TO_WORKSPACE_INIT,
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
