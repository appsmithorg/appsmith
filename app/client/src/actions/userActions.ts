import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { UpdateUserRequest, VerifyTokenRequest } from "ee/api/UserApi";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type {
  ProductAlert,
  ProductAlertConfig,
  ProductAlertState,
} from "reducers/uiReducers/usersReducer";
import type { ApiResponse } from "api/ApiResponses";

export const logoutUser = (payload?: { redirectURL: string }) => ({
  type: ReduxActionTypes.LOGOUT_USER_INIT,
  payload,
});

export const logoutUserSuccess = (isEmptyInstance: boolean) => ({
  type: ReduxActionTypes.LOGOUT_USER_SUCCESS,
  payload: isEmptyInstance,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logoutUserError = (error: any) => ({
  type: ReduxActionErrorTypes.LOGOUT_USER_ERROR,
  payload: {
    error,
  },
});

export const verifyInviteSuccess = () => ({
  type: ReduxActionTypes.VERIFY_INVITE_SUCCESS,
});

export const verifyInvite = (payload: VerifyTokenRequest) => ({
  type: ReduxActionTypes.VERIFY_INVITE_INIT,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const verifyInviteError = (error: any) => ({
  type: ReduxActionErrorTypes.VERIFY_INVITE_ERROR,
  payload: { error },
});

export const invitedUserSignupSuccess = () => ({
  type: ReduxActionTypes.INVITED_USER_SIGNUP_SUCCESS,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invitedUserSignupError = (error: any) => ({
  type: ReduxActionErrorTypes.INVITED_USER_SIGNUP_ERROR,
  payload: {
    error,
  },
});

export const updateUserDetails = (payload: UpdateUserRequest) => ({
  type: ReduxActionTypes.UPDATE_USER_DETAILS_INIT,
  payload,
});

export const updateIntercomConsent = () => ({
  type: ReduxActionTypes.UPDATE_USER_INTERCOM_CONSENT,
});

export const updatePhoto = (payload: {
  file: File;
  callback?: (id: string) => void;
}) => ({
  type: ReduxActionTypes.UPLOAD_PROFILE_PHOTO,
  payload,
});

export const removePhoto = (callback: (id: string) => void) => ({
  type: ReduxActionTypes.REMOVE_PROFILE_PHOTO,
  payload: { callback },
});

export const updatePhotoId = (payload: { photoId: string }) => ({
  type: ReduxActionTypes.UPDATE_PHOTO_ID,
  payload,
});

export const leaveWorkspace = (workspaceId: string) => {
  return {
    type: ReduxActionTypes.LEAVE_WORKSPACE_INIT,
    payload: {
      workspaceId,
    },
  };
};

export const fetchFeatureFlagsInit = (
  featureFlags?: ApiResponse<FeatureFlags>,
) => ({
  type: ReduxActionTypes.FETCH_FEATURE_FLAGS_INIT,
  payload: {
    featureFlags,
  },
});

export const fetchFeatureFlagsSuccess = (payload: FeatureFlags) => ({
  type: ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchFeatureFlagsError = (error: any) => ({
  type: ReduxActionErrorTypes.FETCH_FEATURE_FLAGS_ERROR,
  payload: { error, show: false },
});

export const fetchProductAlertInit = (
  productAlert?: ApiResponse<ProductAlert>,
) => ({
  type: ReduxActionTypes.FETCH_PRODUCT_ALERT_INIT,
  payload: {
    productAlert,
  },
});

export const fetchProductAlertSuccess = (productAlert: ProductAlertState) => ({
  type: ReduxActionTypes.FETCH_PRODUCT_ALERT_SUCCESS,
  payload: productAlert,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchProductAlertFailure = (error: any) => ({
  type: ReduxActionErrorTypes.FETCH_PRODUCT_ALERT_FAILED,
  payload: { error, show: false },
});

export const updateProductAlertConfig = (config: ProductAlertConfig) => ({
  type: ReduxActionTypes.UPDATE_PRODUCT_ALERT_CONFIG,
  payload: config,
});
