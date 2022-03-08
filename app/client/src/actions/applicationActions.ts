import { ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionWithCallbacks,
} from "../constants/ReduxActionConstants";
import { ResponseMeta } from "../api/ApiResponses";
import {
  UpdateApplicationPayload,
  ImportApplicationRequest,
  FetchApplicationPayload,
} from "api/ApplicationApi";

export enum ApplicationVersion {
  DEFAULT = 1,
  SLUG_URL = 2,
}

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

export const fetchApplication = (payload: FetchApplicationPayload) => {
  return {
    type: ReduxActionTypes.FETCH_APPLICATION_INIT,
    payload,
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
  callback?: () => void,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APPLICATION,
    payload: {
      id,
      ...data,
      callback,
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

type ErrorPayload = string;
export type GetSSHKeyResponseData = {
  docUrl: string;
  publicKey?: string;
};

export type GenerateSSHKeyPairResponsePayload<T> = {
  responseMeta: ResponseMeta;
  data: T;
};

export type GenerateSSHKeyPairReduxAction = ReduxActionWithCallbacks<
  undefined,
  GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ErrorPayload
>;

export type GenerateKeyParams = {
  onErrorCallback?: (payload: ErrorPayload) => void;
  onSuccessCallback?: (
    payload: GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ) => void;
  payload?: undefined;
};

export const generateSSHKeyPair = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: GenerateKeyParams): GenerateSSHKeyPairReduxAction => {
  return {
    type: ReduxActionTypes.GENERATE_SSH_KEY_PAIR_INIT,
    payload,
    onErrorCallback,
    onSuccessCallback,
  };
};

export const generateSSHKeyPairSuccess = (
  payload: GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
) => {
  return {
    type: ReduxActionTypes.GENERATE_SSH_KEY_PAIR_SUCCESS,
    payload,
  };
};

export type GetSSHKeyPairResponsePayload<T> = {
  responseMeta: ResponseMeta;
  data: T;
};

export type GetSSHKeyPairReduxAction = ReduxActionWithCallbacks<
  undefined,
  GetSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ErrorPayload
>;

export type GetKeyParams = {
  onErrorCallback?: (payload: ErrorPayload) => void;
  onSuccessCallback?: (
    payload: GetSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ) => void;
  payload?: undefined;
};

export const getSSHKeyPair = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: GetKeyParams): GetSSHKeyPairReduxAction => {
  return {
    type: ReduxActionTypes.FETCH_SSH_KEY_PAIR_INIT,
    payload,
    onErrorCallback,
    onSuccessCallback,
  };
};

export const getSSHKeyPairSuccess = (
  payload: GetSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
) => {
  return {
    type: ReduxActionTypes.FETCH_SSH_KEY_PAIR_SUCCESS,
    payload,
  };
};

export const getSSHKeyPairError = (payload: {
  error: string;
  show: boolean;
}) => {
  return {
    type: ReduxActionErrorTypes.FETCH_SSH_KEY_PAIR_ERROR,
    payload,
  };
};

export const initSSHKeyPairWithNull = () => ({
  type: ReduxActionTypes.INIT_SSH_KEY_PAIR_WITH_NULL,
});
