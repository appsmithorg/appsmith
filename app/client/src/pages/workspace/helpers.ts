import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";
export type InviteUsersToWorkspaceByRoleValues = {
  id: string;
  users?: string;
  permissionGroupId?: string;
  permissionGroupName?: string;
  roles?: any[];
};
export type InviteUsersToWorkspaceFormValues = {
  usersByRole: InviteUsersToWorkspaceByRoleValues[];
};

export type CreateWorkspaceFormValues = {
  name: string;
};

export const createWorkspaceSubmitHandler = (
  values: CreateWorkspaceFormValues,
  dispatch: any,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    dispatch({
      type: ReduxActionTypes.CREATE_WORKSPACE_INIT,
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

export const inviteUsersToWorkspaceSubmitHandler = (
  values: InviteUsersToWorkspaceFormValues,
  dispatch: any,
): Promise<any> => {
  const data = values.usersByRole.map((value) => ({
    permissionGroupId: value.permissionGroupId,
    emails: value.users ? value.users.split(",") : [],
  }));
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

export const inviteUsersToWorkspace = (
  values: any,
  dispatch: any,
): Promise<any> => {
  const data = {
    permissionGroupId: values.permissionGroupId,
    usernames: values.users ? values.users.split(",") : [],
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
