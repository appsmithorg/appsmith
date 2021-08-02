import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { CurrentUserDetailsRequestPayload } from "constants/userConstants";
import {
  TokenPasswordUpdateRequest,
  UpdateUserRequest,
  VerifyTokenRequest,
} from "api/UserApi";

export const logoutUser = (payload?: { redirectURL: string }) => ({
  type: ReduxActionTypes.LOGOUT_USER_INIT,
  payload,
});

export const logoutUserSuccess = () => ({
  type: ReduxActionTypes.LOGOUT_USER_SUCCESS,
});

export const logoutUserError = (error: any) => ({
  type: ReduxActionErrorTypes.LOGOUT_USER_ERROR,
  payload: {
    error,
  },
});
export const setCurrentUserDetails = () => ({
  type: ReduxActionTypes.SET_CURRENT_USER_INIT,
  payload: CurrentUserDetailsRequestPayload,
});

export const verifyInviteSuccess = () => ({
  type: ReduxActionTypes.VERIFY_INVITE_SUCCESS,
});

export const verifyInvite = (payload: VerifyTokenRequest) => ({
  type: ReduxActionTypes.VERIFY_INVITE_INIT,
  payload,
});

export const verifyInviteError = (error: any) => ({
  type: ReduxActionErrorTypes.VERIFY_INVITE_ERROR,
  payload: { error },
});

export const invitedUserSignup = (
  payload: TokenPasswordUpdateRequest & { resolve: any; reject: any },
) => ({
  type: ReduxActionTypes.INVITED_USER_SIGNUP,
  payload,
});

export const invitedUserSignupSuccess = () => ({
  type: ReduxActionTypes.INVITED_USER_SIGNUP_SUCCESS,
});

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

export const updatePhoto = (payload: {
  file: File;
  callback?: () => void;
}) => ({
  type: ReduxActionTypes.UPLOAD_PROFILE_PHOTO,
  payload,
});

export const removePhoto = (callback: () => void) => ({
  type: ReduxActionTypes.REMOVE_PROFILE_PHOTO,
  payload: { callback },
});

export const leaveOrganization = (orgId: string) => {
  return {
    type: ReduxActionTypes.LEAVE_ORG_INIT,
    payload: {
      orgId,
    },
  };
};

export const fetchFeatureFlagsInit = () => ({
  type: ReduxActionTypes.FETCH_FEATURE_FLAGS_INIT,
});

export const fetchFeatureFlagsSuccess = (payload: Record<string, boolean>) => ({
  type: ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS,
  payload,
});

export const fetchFeatureFlagsError = (error: any) => ({
  type: ReduxActionErrorTypes.FETCH_FEATURE_FLAGS_ERROR,
  payload: { error },
});
