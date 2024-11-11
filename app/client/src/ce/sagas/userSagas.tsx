import { call, fork, put, race, select, take } from "redux-saga/effects";
import type {
  ReduxAction,
  ReduxActionWithPromise,
} from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import { reset } from "redux-form";
import type {
  CreateUserRequest,
  CreateUserResponse,
  ForgotPasswordRequest,
  VerifyTokenRequest,
  TokenPasswordUpdateRequest,
  UpdateUserRequest,
  LeaveWorkspaceRequest,
} from "ee/api/UserApi";
import UserApi from "ee/api/UserApi";
import { AUTH_LOGIN_URL, SETUP } from "constants/routes";
import history from "utils/history";
import type { ApiResponse } from "api/ApiResponses";
import type { ErrorActionPayload } from "sagas/ErrorSagas";
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
  fetchProductAlertSuccess,
  fetchProductAlertFailure,
  fetchFeatureFlagsInit,
} from "actions/userActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "ee/constants/forms";
import type { User } from "constants/userConstants";
import {
  flushErrorsAndRedirect,
  safeCrashAppRequest,
} from "actions/errorActions";
import localStorage from "utils/localStorage";
import log from "loglevel";

import {
  getCurrentUser,
  getFeatureFlagsFetched,
} from "selectors/usersSelectors";
import {
  initAppLevelSocketConnection,
  initPageLevelSocketConnection,
} from "actions/websocketActions";
import {
  getEnableStartSignposting,
  getFirstTimeUserOnboardingApplicationIds,
  getFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";
import { initializeAnalyticsAndTrackers } from "utils/AppsmithUtils";
import { getAppsmithConfigs } from "ee/configs";
import { getSegmentState } from "selectors/analyticsSelectors";
import {
  segmentInitUncertain,
  segmentInitSuccess,
} from "actions/analyticsActions";
import type { SegmentState } from "reducers/uiReducers/analyticsReducer";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { DEFAULT_FEATURE_FLAG_VALUE } from "ee/entities/FeatureFlag";
import UsagePulse from "usagePulse";
import { toast } from "@appsmith/ads";
import { isAirgapped } from "ee/utils/airgapHelpers";
import {
  USER_PROFILE_PICTURE_UPLOAD_FAILED,
  UPDATE_USER_DETAILS_FAILED,
} from "ee/constants/messages";
import { createMessage } from "@appsmith/ads-old";
import type {
  ProductAlert,
  ProductAlertConfig,
} from "reducers/uiReducers/usersReducer";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { getFromServerWhenNoPrefetchedResult } from "sagas/helper";
import * as Sentry from "@sentry/react";
import { Severity } from "@sentry/react";
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
    Sentry.captureException("Sign up failed", {
      level: Severity.Error,
      extra: {
        error: error,
      },
    });
  }
}

export function* waitForSegmentInit(skipWithAnonymousId: boolean) {
  if (skipWithAnonymousId && AnalyticsUtil.getAnonymousId()) return;

  const currentUser: User | undefined = yield select(getCurrentUser);
  const segmentState: SegmentState | undefined = yield select(getSegmentState);
  const appsmithConfig = getAppsmithConfigs();

  if (
    currentUser?.enableTelemetry &&
    appsmithConfig.segment.enabled &&
    !segmentState
  ) {
    yield race([
      take(ReduxActionTypes.SEGMENT_INITIALIZED),
      take(ReduxActionTypes.SEGMENT_INIT_UNCERTAIN),
    ]);
  }
}

export function* getCurrentUserSaga(action?: {
  payload?: { userProfile?: ApiResponse };
}) {
  const userProfile = action?.payload?.userProfile;

  try {
    const response: ApiResponse = yield call(
      getFromServerWhenNoPrefetchedResult,
      userProfile,
      () => call(UserApi.getCurrentUser),
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_DETAILS_ERROR,
      payload: {
        error,
      },
    });

    yield put(safeCrashAppRequest());
  }
}

function* initTrackers(currentUser: User) {
  const initializeSentry = initializeAnalyticsAndTrackers(currentUser);

  const sentryInitialized: boolean = yield initializeSentry;

  if (sentryInitialized) {
    yield put(segmentInitSuccess());
  } else {
    yield put(segmentInitUncertain());
  }
}

export function* runUserSideEffectsSaga() {
  const currentUser: User = yield select(getCurrentUser);
  const { enableTelemetry } = currentUser;
  const isAirgappedInstance = isAirgapped();

  if (enableTelemetry) {
    yield fork(initTrackers, currentUser);
  }

  const isFFFetched: boolean = yield select(getFeatureFlagsFetched);

  if (!isFFFetched) {
    yield call(fetchFeatureFlagsInit);
    yield take(ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS);
  }

  const featureFlags: FeatureFlags = yield select(selectFeatureFlags);

  const isGACEnabled = featureFlags?.license_gac_enabled;

  const isFreeLicense = !isGACEnabled;

  if (!isAirgappedInstance) {
    // We need to stop and start tracking activity to ensure that the tracking from previous session is not carried forward
    UsagePulse.stopTrackingActivity();
    UsagePulse.startTrackingActivity(
      enableTelemetry && getAppsmithConfigs().segment.enabled,
      currentUser?.isAnonymous ?? false,
      isFreeLicense,
    );
  }

  yield put(initAppLevelSocketConnection());
  yield put(initPageLevelSocketConnection());

  if (currentUser.emptyInstance) {
    history.replace(SETUP);
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
      const errorMessage: string | undefined =
        yield getResponseErrorMessage(response);

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
      const errorMessage: string | undefined =
        yield getResponseErrorMessage(response);

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
      const errorMessage: string | undefined =
        yield getResponseErrorMessage(response);

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

interface InviteUserPayload {
  email: string;
  permissionGroupId: string;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      recaptchaToken?: string;
    };
  }>,
) {
  const { data, reject, resolve } = action.payload;

  try {
    const response: ApiResponse<{ id: string; username: string }[]> =
      yield callAPI(UserApi.inviteUser, {
        usernames: data.usernames,
        permissionGroupId: data.permissionGroupId,
        recaptchaToken: data.recaptchaToken,
      });
    const isValidResponse: boolean = yield validateResponse(response, false);

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
    const { data: responseData } = response;

    yield put({
      type: ReduxActionTypes.INVITED_USERS_TO_WORKSPACE,
      payload: {
        workspaceId: data.workspaceId,
        users: responseData.map((user: { id: string; username: string }) => ({
          userId: user.id,
          username: user.username,
          permissionGroupId: data.permissionGroupId,
        })),
      },
    });
    yield call(resolve);
    yield put(reset(INVITE_USERS_TO_WORKSPACE_FORM));
  } catch (error) {
    yield call(reject, { _error: (error as Error).message });
  }
}

export function* updateUserDetailsSaga(action: ReduxAction<UpdateUserRequest>) {
  try {
    const { email, intercomConsentGiven, name, proficiency, role, useCase } =
      action.payload;

    const response: ApiResponse = yield callAPI(UserApi.updateUser, {
      email,
      name,
      proficiency,
      role,
      useCase,
      intercomConsentGiven,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    const payload: ErrorActionPayload = {
      show: true,
      error: {
        message:
          (error as Error).message ?? createMessage(UPDATE_USER_DETAILS_FAILED),
      },
    };

    yield put({
      type: ReduxActionErrorTypes.UPDATE_USER_DETAILS_ERROR,
      payload,
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
      UsagePulse.stopTrackingActivity();
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

    if (!response.responseMeta.success) {
      throw response.responseMeta.error;
    }

    //@ts-expect-error: response is of type unknown
    const photoId = response.data?.profilePhotoAssetId; //get updated photo id of iploaded image

    if (action.payload.callback) action.payload.callback(photoId);
  } catch (error) {
    log.error(error);

    const payload: ErrorActionPayload = {
      show: true,
      error: {
        message:
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).message ??
          createMessage(USER_PROFILE_PICTURE_UPLOAD_FAILED),
      },
    };

    yield put({
      type: ReduxActionErrorTypes.USER_PROFILE_PICTURE_UPLOAD_FAILED,
      payload,
    });
  }
}

export function* fetchFeatureFlags(action?: {
  payload?: { featureFlags?: ApiResponse<FeatureFlags> };
}) {
  const featureFlags = action?.payload?.featureFlags;

  try {
    const response: ApiResponse<FeatureFlags> = yield call(
      getFromServerWhenNoPrefetchedResult,
      featureFlags,
      () => call(UserApi.fetchFeatureFlags),
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(
        fetchFeatureFlagsSuccess({
          ...DEFAULT_FEATURE_FLAG_VALUE,
          ...response.data,
        }),
      );
    }
  } catch (error) {
    log.error(error);
    yield put(fetchFeatureFlagsError(error));
  }
}

export function* updateFirstTimeUserOnboardingSage() {
  const enable: boolean | null = yield call(getEnableStartSignposting);

  if (enable) {
    const applicationIds: string[] =
      yield getFirstTimeUserOnboardingApplicationIds() || [];
    const introModalVisibility: string | null =
      yield getFirstTimeUserOnboardingIntroModalVisibility();

    yield put({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
      payload: applicationIds,
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
    const { workspaceId } = action.payload;
    const response: ApiResponse = yield call(UserApi.leaveWorkspace, request);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_WORKSPACE_SUCCESS,
        payload: workspaceId,
      });
      toast.show(`You have successfully left the workspace`, {
        kind: "success",
      });
      history.push("/applications");
    }
  } catch (error) {
    // do nothing as it's already handled globally
  }
}

export function* fetchProductAlertSaga(action?: {
  payload?: { productAlert?: ApiResponse<ProductAlert> };
}) {
  const productAlert = action?.payload?.productAlert;

  try {
    const response: ApiResponse<ProductAlert> = yield call(
      getFromServerWhenNoPrefetchedResult,
      productAlert,
      () => call(UserApi.getProductAlert),
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const message = response.data;

      if (message.messageId) {
        const config = getMessageConfig(message.messageId);

        yield put(fetchProductAlertSuccess({ message, config }));
      }
    } else {
      yield put(fetchProductAlertFailure(response.data));
    }
  } catch (e) {
    yield put(fetchProductAlertFailure(e));
  }
}

export const PRODUCT_ALERT_CONFIG_STORAGE_KEY = "PRODUCT_ALERT_CONFIG";
export const getMessageConfig = (id: string): ProductAlertConfig => {
  const storedConfig =
    localStorage.getItem(PRODUCT_ALERT_CONFIG_STORAGE_KEY) || "{}";
  const alertConfig: Record<string, ProductAlertConfig> =
    JSON.parse(storedConfig);

  if (id in alertConfig) {
    return alertConfig[id];
  }

  return {
    snoozeTill: new Date(),
    dismissed: false,
  };
};

export const setMessageConfig = (id: string, config: ProductAlertConfig) => {
  const storedConfig =
    localStorage.getItem(PRODUCT_ALERT_CONFIG_STORAGE_KEY) || "{}";
  const alertConfig: Record<string, ProductAlertConfig> =
    JSON.parse(storedConfig);

  const updatedConfig: Record<string, ProductAlertConfig> = {
    ...alertConfig,
    [id]: config,
  };

  localStorage.setItem(
    PRODUCT_ALERT_CONFIG_STORAGE_KEY,
    JSON.stringify(updatedConfig),
  );
};
