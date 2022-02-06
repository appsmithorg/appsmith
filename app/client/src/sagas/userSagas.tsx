import { call, takeLatest, put, all, select, take } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionWithPromise,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { reset } from "redux-form";
import UserApi, {
  CreateUserRequest,
  CreateUserResponse,
  ForgotPasswordRequest,
  VerifyTokenRequest,
  TokenPasswordUpdateRequest,
  UpdateUserRequest,
  LeaveOrgRequest,
} from "api/UserApi";
import {
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  BASE_URL,
  SETUP,
} from "constants/routes";
import history from "utils/history";
import { ApiResponse } from "api/ApiResponses";
import {
  validateResponse,
  getResponseErrorMessage,
  callAPI,
} from "./ErrorSagas";
import {
  logoutUserSuccess,
  logoutUserError,
  verifyInviteSuccess,
  verifyInviteError,
  invitedUserSignupError,
  invitedUserSignupSuccess,
  fetchFeatureFlagsSuccess,
  fetchFeatureFlagsError,
  fetchFeatureFlagsInit,
} from "actions/userActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import {
  ANONYMOUS_USERNAME,
  CommentsOnboardingState,
} from "constants/userConstants";
import { flushErrorsAndRedirect } from "actions/errorActions";
import localStorage from "utils/localStorage";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import log from "loglevel";

import { getCurrentUser } from "selectors/usersSelectors";
import {
  initAppLevelSocketConnection,
  initPageLevelSocketConnection,
} from "actions/websocketActions";
import {
  getEnableFirstTimeUserOnboarding,
  getFirstTimeUserOnboardingApplicationId,
  getFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";
import { initializeAnalyticsAndTrackers } from "utils/AppsmithUtils";

export function* createUserSaga(
  action: ReduxActionWithPromise<CreateUserRequest>,
) {
  const { email, password, reject, resolve } = action.payload;
  try {
    const request: CreateUserRequest = { email, password };
    const response: CreateUserResponse = yield callAPI(
      UserApi.createUser,
      request,
    );
    //TODO(abhinav): DRY this
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage = getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    } else {
      const { email, id, name } = response.data;
      yield put({
        type: ReduxActionTypes.CREATE_USER_SUCCESS,
        payload: {
          email,
          name,
          id,
        },
      });
      yield call(resolve);
    }
  } catch (error) {
    yield call(reject, { _error: error.message });
    yield put({
      type: ReduxActionErrorTypes.CREATE_USER_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* getCurrentUserSaga() {
  try {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.USER_ME_API,
    );
    const response: ApiResponse = yield call(UserApi.getCurrentUser);

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const { enableTelemetry } = response.data;
      if (enableTelemetry) {
        initializeAnalyticsAndTrackers();
      }
      yield put(initAppLevelSocketConnection());
      yield put(initPageLevelSocketConnection());
      if (
        !response.data.isAnonymous &&
        response.data.username !== ANONYMOUS_USERNAME
      ) {
        enableTelemetry && AnalyticsUtil.identifyUser(response.data);
        // make fetch feature call only if logged in
        yield put(fetchFeatureFlagsInit());
      } else {
        // reset the flagsFetched flag
        yield put(fetchFeatureFlagsSuccess());
      }
      yield put({
        type: ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
      if (response.data.emptyInstance) {
        history.replace(SETUP);
      } else if (window.location.pathname === BASE_URL) {
        if (response.data.isAnonymous) {
          history.replace(AUTH_LOGIN_URL);
        } else {
          history.replace(APPLICATIONS_URL);
        }
      }
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.USER_ME_API,
      );
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.USER_ME_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_DETAILS_ERROR,
      payload: {
        error,
      },
    });

    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH,
      payload: {
        code: ERROR_CODES.SERVER_ERROR,
      },
    });
  }
}

export function* forgotPasswordSaga(
  action: ReduxActionWithPromise<ForgotPasswordRequest>,
) {
  const { email, reject, resolve } = action.payload;

  try {
    const request: ForgotPasswordRequest = { email };
    const response: ApiResponse = yield callAPI(
      UserApi.forgotPassword,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage = yield getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.FORGOT_PASSWORD_SUCCESS,
      });
      yield call(resolve);
    }
  } catch (error) {
    log.error(error);
    yield call(reject, { _error: error.message });
    yield put({
      type: ReduxActionErrorTypes.FORGOT_PASSWORD_ERROR,
    });
  }
}

export function* resetPasswordSaga(
  action: ReduxActionWithPromise<TokenPasswordUpdateRequest>,
) {
  const { email, password, reject, resolve, token } = action.payload;
  try {
    const request: TokenPasswordUpdateRequest = {
      email,
      password,
      token,
    };
    const response: ApiResponse = yield callAPI(UserApi.resetPassword, request);
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage = yield getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.RESET_USER_PASSWORD_SUCCESS,
      });
      yield call(resolve);
    }
  } catch (error) {
    log.error(error);
    yield call(reject, { _error: error.message });
    yield put({
      type: ReduxActionErrorTypes.RESET_USER_PASSWORD_ERROR,
      payload: {
        error: error.message,
      },
    });
  }
}

export function* invitedUserSignupSaga(
  action: ReduxActionWithPromise<TokenPasswordUpdateRequest>,
) {
  const { email, password, reject, resolve, token } = action.payload;
  try {
    const request: TokenPasswordUpdateRequest = { email, password, token };
    const response: ApiResponse = yield callAPI(
      UserApi.confirmInvitedUserSignup,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage = yield getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    } else {
      yield put(invitedUserSignupSuccess());
      yield call(resolve);
    }
  } catch (error) {
    log.error(error);
    yield call(reject, { _error: error.message });
    yield put(invitedUserSignupError(error));
  }
}

type InviteUserPayload = {
  email: string;
  orgId: string;
  roleName: string;
};

export function* inviteUser(payload: InviteUserPayload, reject: any) {
  const response: ApiResponse = yield callAPI(UserApi.inviteUser, payload);
  const isValidResponse = yield validateResponse(response);
  if (!isValidResponse) {
    let errorMessage = `${payload.email}:  `;
    errorMessage += getResponseErrorMessage(response);
    yield call(reject, { _error: errorMessage });
  }
  yield;
}

export function* inviteUsers(
  action: ReduxActionWithPromise<{
    data: { usernames: string[]; orgId: string; roleName: string };
  }>,
) {
  const { data, reject, resolve } = action.payload;
  try {
    const response: ApiResponse = yield callAPI(UserApi.inviteUser, {
      usernames: data.usernames,
      orgId: data.orgId,
      roleName: data.roleName,
    });
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      let errorMessage = `${data.usernames}:  `;
      errorMessage += getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    }
    yield put({
      type: ReduxActionTypes.FETCH_ALL_USERS_INIT,
      payload: {
        orgId: data.orgId,
      },
    });
    yield put({
      type: ReduxActionTypes.INVITED_USERS_TO_ORGANIZATION,
      payload: {
        orgId: data.orgId,
        users: data.usernames.map((name: string) => ({
          username: name,
          roleName: data.roleName,
        })),
      },
    });
    yield call(resolve);
    yield put(reset(INVITE_USERS_TO_ORG_FORM));
  } catch (error) {
    yield call(reject, { _error: error.message });
    yield put({
      type: ReduxActionErrorTypes.INVITE_USERS_TO_ORG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updateUserDetailsSaga(action: ReduxAction<UpdateUserRequest>) {
  try {
    const { email, name, role, useCase } = action.payload;
    const response: ApiResponse = yield callAPI(UserApi.updateUser, {
      email,
      name,
      role,
      useCase,
    });
    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_USER_DETAILS_ERROR,
      payload: error.message,
    });
  }
}

export function* verifyResetPasswordTokenSaga(
  action: ReduxAction<VerifyTokenRequest>,
) {
  try {
    const request: VerifyTokenRequest = action.payload;
    const response: ApiResponse = yield call(
      UserApi.verifyResetPasswordToken,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse && response.data) {
      yield put({
        type: ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_SUCCESS,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.RESET_PASSWORD_VERIFY_TOKEN_ERROR,
      });
    }
  } catch (error) {
    log.error(error);
    yield put({
      type: ReduxActionErrorTypes.RESET_PASSWORD_VERIFY_TOKEN_ERROR,
    });
  }
}

export function* verifyUserInviteSaga(action: ReduxAction<VerifyTokenRequest>) {
  try {
    const request: VerifyTokenRequest = action.payload;
    const response: ApiResponse = yield call(UserApi.verifyUserInvite, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(verifyInviteSuccess());
    }
  } catch (error) {
    log.error(error);
    yield put(verifyInviteError(error));
  }
}

export function* logoutSaga(action: ReduxAction<{ redirectURL: string }>) {
  try {
    const redirectURL = action.payload?.redirectURL;
    const response: ApiResponse = yield call(UserApi.logoutUser);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.reset();
      const currentUser = yield select(getCurrentUser);
      yield put(logoutUserSuccess(!!currentUser?.emptyInstance));
      localStorage.clear();
      yield put(flushErrorsAndRedirect(redirectURL || AUTH_LOGIN_URL));
    }
  } catch (error) {
    log.error(error);
    yield put(logoutUserError(error));
  }
}

export function* waitForFetchUserSuccess() {
  const currentUser = yield select(getCurrentUser);
  if (!currentUser) {
    yield take(ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS);
  }
}

function* removePhoto(action: ReduxAction<{ callback: (id: string) => void }>) {
  try {
    const response: ApiResponse = yield call(UserApi.deletePhoto);
    const photoId = response.data?.profilePhotoAssetId; //get updated photo id of iploaded image
    if (action.payload.callback) action.payload.callback(photoId);
  } catch (error) {
    log.error(error);
  }
}

function* updatePhoto(
  action: ReduxAction<{ file: File; callback: (id: string) => void }>,
) {
  try {
    const response: ApiResponse = yield call(UserApi.uploadPhoto, {
      file: action.payload.file,
    });
    const photoId = response.data?.profilePhotoAssetId; //get updated photo id of iploaded image
    if (action.payload.callback) action.payload.callback(photoId);
  } catch (error) {
    log.error(error);
  }
}

function* fetchFeatureFlags() {
  try {
    const response: ApiResponse = yield call(UserApi.fetchFeatureFlags);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      (window as any).FEATURE_FLAGS = response.data;
      yield put(fetchFeatureFlagsSuccess());
    }
  } catch (error) {
    log.error(error);
    yield put(fetchFeatureFlagsError(error));
  }
}

function* updateFirstTimeUserOnboardingSage() {
  const enable = yield getEnableFirstTimeUserOnboarding();

  if (enable) {
    const applicationId = yield getFirstTimeUserOnboardingApplicationId() || "";
    const introModalVisibility = yield getFirstTimeUserOnboardingIntroModalVisibility();
    yield put({
      type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
      payload: true,
    });
    yield put({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      payload: applicationId,
    });
    yield put({
      type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      payload: introModalVisibility,
    });
  }
}

export function* updateUsersCommentsOnboardingState(
  action: ReduxAction<CommentsOnboardingState>,
) {
  try {
    yield call(UserApi.updateUsersCommentOnboardingState, {
      commentOnboardingState: action.payload,
    });
  } catch (error) {
    log.error(error);
  }
}

export default function* userSagas() {
  yield all([
    takeLatest(ReduxActionTypes.CREATE_USER_INIT, createUserSaga),
    takeLatest(ReduxActionTypes.FETCH_USER_INIT, getCurrentUserSaga),
    takeLatest(ReduxActionTypes.FORGOT_PASSWORD_INIT, forgotPasswordSaga),
    takeLatest(ReduxActionTypes.RESET_USER_PASSWORD_INIT, resetPasswordSaga),
    takeLatest(
      ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_INIT,
      verifyResetPasswordTokenSaga,
    ),
    takeLatest(ReduxActionTypes.INVITE_USERS_TO_ORG_INIT, inviteUsers),
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
    takeLatest(ReduxActionTypes.LEAVE_ORG_INIT, leaveOrgSaga),
    takeLatest(ReduxActionTypes.FETCH_FEATURE_FLAGS_INIT, fetchFeatureFlags),
    takeLatest(
      ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
      updateFirstTimeUserOnboardingSage,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_USERS_COMMENTS_ONBOARDING_STATE,
      updateUsersCommentsOnboardingState,
    ),
  ]);
}

export function* leaveOrgSaga(action: ReduxAction<LeaveOrgRequest>) {
  try {
    const request: LeaveOrgRequest = action.payload;
    const response: ApiResponse = yield call(UserApi.leaveOrg, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
      });
      Toaster.show({
        text: `You have successfully left the organization`,
        variant: Variant.success,
      });
    }
  } catch (error) {
    // do nothing as it's already handled globally
  }
}
