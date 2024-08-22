import {
  createUserSaga,
  fetchFeatureFlags,
  fetchProductAlertSaga,
  forgotPasswordSaga,
  getCurrentUserSaga,
  inviteUsers,
  invitedUserSignupSaga,
  leaveWorkspaceSaga,
  logoutSaga,
  removePhoto,
  resetPasswordSaga,
  runUserSideEffectsSaga,
  updateFirstTimeUserOnboardingSage,
  updatePhoto,
  updateUserDetailsSaga,
  verifyResetPasswordTokenSaga,
  verifyUserInviteSaga,
} from "ce/sagas/userSagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";

export * from "ce/sagas/userSagas";

export default function* userSagas() {
  yield all([
    takeLatest(ReduxActionTypes.CREATE_USER_INIT, createUserSaga),
    takeLatest(ReduxActionTypes.FETCH_USER_INIT, getCurrentUserSaga),
    takeLatest(
      ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
      runUserSideEffectsSaga,
    ),
    takeLatest(ReduxActionTypes.FORGOT_PASSWORD_INIT, forgotPasswordSaga),
    takeLatest(ReduxActionTypes.RESET_USER_PASSWORD_INIT, resetPasswordSaga),
    takeLatest(
      ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_INIT,
      verifyResetPasswordTokenSaga,
    ),
    takeLatest(ReduxActionTypes.INVITE_USERS_TO_WORKSPACE_INIT, inviteUsers),
    takeLatest(ReduxActionTypes.LOGOUT_USER_INIT, logoutSaga),
    takeLatest(ReduxActionTypes.VERIFY_INVITE_INIT, verifyUserInviteSaga),
    takeLatest(
      ReduxActionTypes.INVITED_USER_SIGNUP_INIT,
      invitedUserSignupSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_USER_DETAILS_INIT,
      updateUserDetailsSaga,
    ),
    takeLatest(ReduxActionTypes.REMOVE_PROFILE_PHOTO, removePhoto),
    takeLatest(ReduxActionTypes.UPLOAD_PROFILE_PHOTO, updatePhoto),
    takeLatest(ReduxActionTypes.LEAVE_WORKSPACE_INIT, leaveWorkspaceSaga),
    takeLatest(ReduxActionTypes.FETCH_FEATURE_FLAGS_INIT, fetchFeatureFlags),
    takeLatest(
      ReduxActionTypes.FETCH_PRODUCT_ALERT_INIT,
      fetchProductAlertSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
      updateFirstTimeUserOnboardingSage,
    ),
  ]);
}
