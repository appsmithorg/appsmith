export * from "ce/sagas/userSagas";
import {
  createUserSaga,
  getCurrentUserSaga,
  runUserSideEffectsSaga,
  forgotPasswordSaga,
  resetPasswordSaga,
  verifyResetPasswordTokenSaga,
  verifyUserInviteSaga,
  invitedUserSignupSaga,
  updateUserDetailsSaga,
  removePhoto,
  updatePhoto,
  leaveWorkspaceSaga,
  fetchFeatureFlags,
  updateFirstTimeUserOnboardingSage,
} from "ce/sagas/userSagas";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithPromise,
} from "@appsmith/constants/ReduxActionConstants";
import { takeLatest, all, call, put, select } from "redux-saga/effects";
import { ApiResponse } from "api/ApiResponses";
import {
  callAPI,
  getResponseErrorMessage,
  validateResponse,
} from "sagas/ErrorSagas";
import UserApi from "@appsmith/api/UserApi";
import { reset } from "redux-form";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";
import { User } from "@sentry/react";
import { flushErrorsAndRedirect } from "actions/errorActions";
import { logoutUserSuccess, logoutUserError } from "actions/userActions";
import { AUTH_LOGIN_URL } from "constants/routes";
import log from "loglevel";
import { getCurrentUser } from "selectors/usersSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

export function* inviteUsers(
  action: ReduxActionWithPromise<{
    data: {
      usernames: string[];
      groups: string[];
      workspaceId: string;
      permissionGroupId: string;
    };
  }>,
) {
  const { data, reject, resolve } = action.payload;
  try {
    const response: ApiResponse = yield callAPI(UserApi.inviteUser, {
      usernames: data.usernames,
      groups: data.groups,
      permissionGroupId: data.permissionGroupId,
    });
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      let errorMessage = `${data.usernames}:  `;
      errorMessage += getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    }
    yield put({
      type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
      payload: {
        workspaceId: data.workspaceId,
      },
    });
    yield put({
      type: ReduxActionTypes.INVITED_USERS_TO_WORKSPACE,
      payload: {
        workspaceId: data.workspaceId,
        users: data.usernames.map((name: string) => ({
          username: name,
          permissionGroupId: data.permissionGroupId,
        })),
        groups: data.groups.map((name: string) => ({
          username: name,
          permissionGroupId: data.permissionGroupId,
        })),
      },
    });
    yield call(resolve);
    yield put(reset(INVITE_USERS_TO_WORKSPACE_FORM));
  } catch (error) {
    yield call(reject, { _error: (error as Error).message });
    yield put({
      type: ReduxActionErrorTypes.INVITE_USERS_TO_WORKSPACE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* logoutSaga(action: ReduxAction<{ redirectURL: string }>) {
  try {
    const redirectURL = action.payload?.redirectURL;
    const response: ApiResponse = yield call(UserApi.logoutUser);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.reset();
      const currentUser: User | undefined = yield select(getCurrentUser);
      yield put(logoutUserSuccess(!!currentUser?.emptyInstance));
      yield put({ type: ReduxActionTypes.STOP_LICENSE_STATUS_CHECK });
      localStorage.clear();
      yield put(flushErrorsAndRedirect(redirectURL || AUTH_LOGIN_URL));
    }
  } catch (error) {
    log.error(error);
    yield put(logoutUserError(error));
  }
}

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
      ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
      updateFirstTimeUserOnboardingSage,
    ),
  ]);
}
