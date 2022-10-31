import { call, put, select, take } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionWithPromise,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { reset } from "redux-form";
import UserApi, {
  CreateUserRequest,
  CreateUserResponse,
  ForgotPasswordRequest,
  VerifyTokenRequest,
  TokenPasswordUpdateRequest,
  UpdateUserRequest,
  LeaveWorkspaceRequest,
} from "@appsmith/api/UserApi";
import { AUTH_LOGIN_URL, SETUP } from "constants/routes";
import history from "utils/history";
import { ApiResponse } from "api/ApiResponses";
import {
  validateResponse,
  getResponseErrorMessage,
  callAPI,
} from "sagas/ErrorSagas";
import {
  logoutUserSuccess,
  logoutUserError,
  verifyInviteSuccess,
  verifyInviteError,
  invitedUserSignupError,
  invitedUserSignupSuccess,
  fetchFeatureFlagsSuccess,
  fetchFeatureFlagsError,
} from "actions/userActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { flushErrorsAndRedirect } from "actions/errorActions";
import localStorage from "utils/localStorage";
import { Toaster, Variant } from "design-system";
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
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage = getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    } else {
      //@ts-expect-error: response is of type unknown
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
    yield call(reject, { _error: (error as Error).message });
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

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      //@ts-expect-error: response is of type unknown
      const { enableTelemetry } = response.data;
      if (enableTelemetry) {
        initializeAnalyticsAndTrackers();
      }
      yield put(initAppLevelSocketConnection());
      yield put(initPageLevelSocketConnection());
      if (
        //@ts-expect-error: response is of type unknown
        !response.data.isAnonymous &&
        //@ts-expect-error: response is of type unknown
        response.data.username !== ANONYMOUS_USERNAME
      ) {
        //@ts-expect-error: response is of type unknown
        enableTelemetry && AnalyticsUtil.identifyUser(response.data);
      }
      yield put({
        type: ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
      //@ts-expect-error: response is of type unknown
      if (response.data.emptyInstance) {
        history.replace(SETUP);
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
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
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
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage: string | undefined = yield getResponseErrorMessage(
        response,
      );
      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.FORGOT_PASSWORD_SUCCESS,
      });
      yield call(resolve);
    }
  } catch (error) {
    log.error(error);
    yield call(reject, { _error: (error as Error).message });
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
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage: string | undefined = yield getResponseErrorMessage(
        response,
      );
      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.RESET_USER_PASSWORD_SUCCESS,
      });
      yield call(resolve);
    }
  } catch (error) {
    log.error(error);
    yield call(reject, { _error: (error as Error).message });
    yield put({
      type: ReduxActionErrorTypes.RESET_USER_PASSWORD_ERROR,
      payload: {
        error: (error as Error).message,
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
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage: string | undefined = yield getResponseErrorMessage(
        response,
      );
      yield call(reject, { _error: errorMessage });
    } else {
      yield put(invitedUserSignupSuccess());
      yield call(resolve);
    }
  } catch (error) {
    log.error(error);
    yield call(reject, { _error: (error as Error).message });
    yield put(invitedUserSignupError(error));
  }
}

type InviteUserPayload = {
  email: string;
  permissionGroupId: string;
};

export function* inviteUser(payload: InviteUserPayload, reject: any) {
  const response: ApiResponse = yield callAPI(UserApi.inviteUser, payload);
  const isValidResponse: boolean = yield validateResponse(response);
  if (!isValidResponse) {
    let errorMessage = `${payload.email}:  `;
    errorMessage += getResponseErrorMessage(response);
    yield call(reject, { _error: errorMessage });
  }
  yield;
}

export function* inviteUsers(
  action: ReduxActionWithPromise<{
    data: {
      usernames: string[];
      workspaceId: string;
      permissionGroupId: string;
    };
  }>,
) {
  const { data, reject, resolve } = action.payload;
  try {
    const response: ApiResponse = yield callAPI(UserApi.inviteUser, {
      usernames: data.usernames,
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

export function* updateUserDetailsSaga(action: ReduxAction<UpdateUserRequest>) {
  try {
    const { email, name, role, useCase } = action.payload;
    const response: ApiResponse = yield callAPI(UserApi.updateUser, {
      email,
      name,
      role,
      useCase,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_USER_DETAILS_ERROR,
      payload: (error as Error).message,
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
    const isValidResponse: boolean = yield validateResponse(response);
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
    const isValidResponse: boolean = yield validateResponse(response);
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
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.reset();
      const currentUser: User | undefined = yield select(getCurrentUser);
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
  const currentUser: string | undefined = yield select(getCurrentUser);
  if (!currentUser) {
    yield take(ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS);
  }
}

export function* removePhoto(
  action: ReduxAction<{ callback: (id: string) => void }>,
) {
  try {
    const response: ApiResponse = yield call(UserApi.deletePhoto);
    //@ts-expect-error: response is of type unknown
    const photoId = response.data?.profilePhotoAssetId; //get updated photo id of iploaded image
    if (action.payload.callback) action.payload.callback(photoId);
  } catch (error) {
    log.error(error);
  }
}

export function* updatePhoto(
  action: ReduxAction<{ file: File; callback: (id: string) => void }>,
) {
  try {
    const response: ApiResponse = yield call(UserApi.uploadPhoto, {
      file: action.payload.file,
    });
    //@ts-expect-error: response is of type unknown
    const photoId = response.data?.profilePhotoAssetId; //get updated photo id of iploaded image
    if (action.payload.callback) action.payload.callback(photoId);
  } catch (error) {
    log.error(error);
  }
}

export function* fetchFeatureFlags() {
  try {
    const response: ApiResponse = yield call(UserApi.fetchFeatureFlags);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      // @ts-expect-error: response.data is of type unknown
      yield put(fetchFeatureFlagsSuccess(response.data));
    }
  } catch (error) {
    log.error(error);
    yield put(fetchFeatureFlagsError(error));
  }
}

export function* updateFirstTimeUserOnboardingSage() {
  const enable: string | null = yield getEnableFirstTimeUserOnboarding();

  if (enable) {
    const applicationId: string = yield getFirstTimeUserOnboardingApplicationId() ||
      "";
    const introModalVisibility:
      | string
      | null = yield getFirstTimeUserOnboardingIntroModalVisibility();
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

export function* leaveWorkspaceSaga(
  action: ReduxAction<LeaveWorkspaceRequest>,
) {
  try {
    const request: LeaveWorkspaceRequest = action.payload;
    const response: ApiResponse = yield call(UserApi.leaveWorkspace, request);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
      });
      Toaster.show({
        text: `You have successfully left the workspace`,
        variant: Variant.success,
      });
    }
  } catch (error) {
    // do nothing as it's already handled globally
  }
}
