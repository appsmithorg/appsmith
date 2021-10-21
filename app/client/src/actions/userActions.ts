import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  CommentsOnboardingState,
  CurrentUserDetailsRequestPayload,
} from "constants/userConstants";
import {
  TokenPasswordUpdateRequest,
  UpdateUserRequest,
  VerifyTokenRequest,
} from "api/UserApi";

export const logoutUser = (payload?: { redirectURL: string }) => ({
  type: ReduxActionTypes.LOGOUT_USER_INIT,
  payload,
});

export const logoutUserSuccess = (isEmptyInstance: boolean) => ({
  type: ReduxActionTypes.LOGOUT_USER_SUCCESS,
  payload: isEmptyInstance,
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
  type: ReduxActionTypes.INVITED_USER_SIGNUP_INIT,
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

export const updateUsersCommentOnboardingState = (
  payload: CommentsOnboardingState,
) => ({
  type: ReduxActionTypes.UPDATE_USERS_COMMENTS_ONBOARDING_STATE,
  payload,
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

export const fetchFeatureFlagsSuccess = () => ({
  type: ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS,
});

export const fetchFeatureFlagsError = (error: any) => ({
  type: ReduxActionErrorTypes.FETCH_FEATURE_FLAGS_ERROR,
  payload: { error, show: false },
});
