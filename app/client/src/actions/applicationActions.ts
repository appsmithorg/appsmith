import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import {
  ReduxActionErrorTypes,
  ReduxActionWithCallbacks,
} from "../constants/ReduxActionConstants";
import {
  FetchApplicationResponse,
  generateSSHKeyPairRequest,
} from "../api/ApplicationApi";
import { ResponseMeta } from "../api/ApiResponses";
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
  branchName?: string;
  mode: APP_MODE;
}

export type FetchApplicationReduxAction = ReduxActionWithCallbacks<
  FetchApplicationPayload,
  FetchApplicationResponse,
  string
>;

export const fetchApplication = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: {
  payload: FetchApplicationPayload;
  onSuccessCallback?: (payload: FetchApplicationResponse) => void;
  onErrorCallback?: (error: string) => void;
}): FetchApplicationReduxAction => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_INIT,
    payload,
    onSuccessCallback,
    onErrorCallback,
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

type errorPayload = string;

export type GenerateSSHKeyPairResponsePayload<T> = {
  responseMeta: ResponseMeta;
  data: T;
};

export type generateSSHKeyPairReduxAction = ReduxActionWithCallbacks<
  generateSSHKeyPairRequest,
  GenerateSSHKeyPairResponsePayload<string>,
  errorPayload
>;

export type GenerateKeyParams = {
  onErrorCallback?: (payload: errorPayload) => void;
  onSuccessCallback?: (
    payload: GenerateSSHKeyPairResponsePayload<string>,
  ) => void;
  payload: generateSSHKeyPairRequest;
};

export const generateSSHKeyPair = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: GenerateKeyParams): generateSSHKeyPairReduxAction => {
  return {
    type: ReduxActionTypes.GENERATE_SSH_KEY_PAIR_INIT,
    payload,
    onErrorCallback,
    onSuccessCallback,
  };
};

export const generateSSHKeyPairSuccess = (
  payload: GenerateSSHKeyPairResponsePayload<string>,
) => {
  return {
    type: ReduxActionTypes.GENERATE_SSH_KEY_PAIR_SUCCESS,
    payload,
  };
};

export const generateSSHKeyPairError = (error: string) => {
  return {
    type: ReduxActionErrorTypes.GENERATE_SSH_KEY_PAIR_ERROR,
    error,
  };
};
