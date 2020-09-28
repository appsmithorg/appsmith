import { call, takeLatest, put, all } from "redux-saga/effects";
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
  SwitchUserOrgRequest,
  AddUserToOrgRequest,
} from "api/UserApi";
import { APPLICATIONS_URL, AUTH_LOGIN_URL, BASE_URL } from "constants/routes";
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
} from "actions/userActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

export function* createUserSaga(
  action: ReduxActionWithPromise<CreateUserRequest>,
) {
  const { email, password, resolve, reject } = action.payload;
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
      const { email, name, id } = response.data;
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
      AnalyticsUtil.identifyUser(response.data.username, response.data);
      if (window.location.pathname === BASE_URL) {
        if (response.data.isAnonymous) {
          history.replace(AUTH_LOGIN_URL);
        } else {
          history.replace(APPLICATIONS_URL);
        }
      }
      yield put({
        type: ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
        payload: response.data,
      });
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
  }
}

export function* forgotPasswordSaga(
  action: ReduxActionWithPromise<ForgotPasswordRequest>,
) {
  const { email, resolve, reject } = action.payload;

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
    console.log(error);
    yield call(reject, { _error: error.message });
    yield put({
      type: ReduxActionErrorTypes.FORGOT_PASSWORD_ERROR,
    });
  }
}

export function* resetPasswordSaga(
  action: ReduxActionWithPromise<TokenPasswordUpdateRequest>,
) {
  const { email, token, password, resolve, reject } = action.payload;
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
    console.log(error);
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
  const { email, token, password, resolve, reject } = action.payload;
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
    console.log(error);
    yield call(reject, { _error: error.message });
    yield put(invitedUserSignupError(error));
  }
}

type InviteUserPayload = {
  email: string;
  groupIds: string[];
};

export function* inviteUser(
  payload: { email: string; orgId: string; roleName: string },
  reject: any,
) {
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
  const { data, resolve, reject } = action.payload;
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
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_SUCCESS,
      });
    }
  } catch (error) {
    console.log(error);
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
    console.log(error);
    yield put(verifyInviteError(error));
  }
}

export function* switchUserOrgSaga(action: ReduxAction<SwitchUserOrgRequest>) {
  try {
    const request: SwitchUserOrgRequest = action.payload;
    const response: ApiResponse = yield call(UserApi.switchUserOrg, request);
    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      window.location.reload();
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SWITCH_ORGANIZATION_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* addUserToOrgSaga(
  action: ReduxAction<AddUserToOrgRequest & { switchToOrg?: boolean }>,
) {
  try {
    const { orgId, switchToOrg } = action.payload;
    const request: AddUserToOrgRequest = { orgId };
    const response: ApiResponse = yield call(UserApi.addOrganization, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      if (switchToOrg) {
        yield put({
          type: ReduxActionTypes.SWITCH_ORGANIZATION_INIT,
          payload: { orgId },
        });
      }
      yield put({
        type: ReduxActionTypes.ADD_USER_TO_ORG_SUCCESS,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_USER_TO_ORG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* logoutSaga() {
  try {
    const response: ApiResponse = yield call(UserApi.logoutUser);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.reset();
      yield put(logoutUserSuccess());
      history.push(AUTH_LOGIN_URL);
    }
  } catch (error) {
    console.log(error);
    yield put(logoutUserError(error));
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
    takeLatest(ReduxActionTypes.SWITCH_ORGANIZATION_INIT, switchUserOrgSaga),
    takeLatest(ReduxActionTypes.ADD_USER_TO_ORG_INIT, addUserToOrgSaga),
  ]);
}
