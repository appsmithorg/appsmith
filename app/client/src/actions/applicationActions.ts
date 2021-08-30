import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import {
  UpdateApplicationPayload,
  ImportApplicationRequest,
} from "api/ApplicationApi";

export const setDefaultApplicationPageSuccess = (
  pageId: string,
  applicationId: string,
) => {
  return {
    type: ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS,
    payload: {
      pageId,
      applicationId,
    },
  };
};

export interface FetchApplicationPayload {
  applicationId: string;
  mode: APP_MODE;
}

export const fetchApplication = (
  applicationId: string,
  mode: APP_MODE,
): ReduxAction<FetchApplicationPayload> => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_INIT,
    payload: {
      applicationId,
      mode,
    },
  };
};

export const updateApplicationLayout = (
  id: string,
  data: UpdateApplicationPayload,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APP_LAYOUT,
    payload: {
      id,
      ...data,
    },
  };
};

export const updateApplication = (
  id: string,
  data: UpdateApplicationPayload,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APPLICATION,
    payload: {
      id,
      ...data,
    },
  };
};

export const publishApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
    payload: {
      applicationId,
    },
  };
};

export const duplicateApplication = (applicationId: string) => {
  return {
    type: ReduxActionTypes.DUPLICATE_APPLICATION_INIT,
    payload: {
      applicationId,
    },
  };
};

export const importApplication = (appDetails: ImportApplicationRequest) => {
  return {
    type: ReduxActionTypes.IMPORT_APPLICATION_INIT,
    payload: appDetails,
  };
};

export const getAllApplications = () => {
  return {
    type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
  };
};

export const resetCurrentApplication = () => {
  return {
    type: ReduxActionTypes.RESET_CURRENT_APPLICATION,
  };
};

export const setShowAppInviteUsersDialog = (payload: boolean) => ({
  type: ReduxActionTypes.SET_SHOW_APP_INVITE_USERS_MODAL,
  payload,
});
