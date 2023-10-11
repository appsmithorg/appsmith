import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SubmissionError } from "redux-form";
import type { RouteChildrenProps, RouteComponentProps } from "react-router-dom";
import type { DefaultOptionType } from "rc-select/lib/Select";
export interface InviteUsersToWorkspaceByRoleValues {
  id: string;
  users?: string;
  permissionGroupId?: string;
  permissionGroupName?: string;
  roles?: any[];
}
export interface InviteUsersToWorkspaceFormValues {
  usersByRole: InviteUsersToWorkspaceByRoleValues[];
}

export interface InviteUsersProps {
  roles?: DefaultOptionType[];
  applicationId?: string;
  workspaceId?: string;
  isApplicationPage?: boolean;
  placeholder?: string;
  customProps?: any;
  selected?: any;
  options?: any;
  isMultiSelectDropdown?: boolean;
  checkIfInvitedUsersFromDifferentDomain?: () => void;
}

export interface CreateWorkspaceFormValues {
  name: string;
}

export const createWorkspaceSubmitHandler = async (
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

export const inviteUsersToWorkspaceSubmitHandler = async (
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

export const inviteUsersToWorkspace = async (
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

export function navigateToTab(
  tabKey: string,
  location: RouteChildrenProps["location"],
  history: RouteComponentProps["history"],
) {
  const settingsStartIndex = location.pathname.indexOf("settings");
  const settingsEndIndex = settingsStartIndex + "settings".length;
  const hasSlash = location.pathname[settingsEndIndex] === "/";
  let newUrl = "";

  if (hasSlash) {
    newUrl = `${location.pathname.slice(0, settingsEndIndex)}/${tabKey}`;
  } else {
    newUrl = `${location.pathname}/${tabKey}`;
  }
  history.push(newUrl);
}
