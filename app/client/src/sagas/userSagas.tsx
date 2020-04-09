import { call, takeLatest, put, all } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionWithPromise,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import UserApi, {
  CreateUserRequest,
  CreateUserResponse,
  ForgotPasswordRequest,
  VerifyTokenRequest,
  TokenPasswordUpdateRequest,
  FetchUserRequest,
  FetchUserResponse,
  SwitchUserOrgRequest,
  AddUserToOrgRequest,
} from "api/UserApi";
import { ApiResponse } from "api/ApiResponses";
import {
  validateResponse,
  getResponseErrorMessage,
  callAPI,
} from "./ErrorSagas";
import * as Sentry from "@sentry/browser";

import { fetchOrgsSaga } from "./OrgSagas";

import { resetAuthExpiration } from "utils/storage";
import {
  logoutUserSuccess,
  fetchCurrentUser,
  logoutUserError,
  verifyInviteSuccess,
  verifyInviteError,
  invitedUserSignupError,
  invitedUserSignupSuccess,
} from "actions/userActions";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
    data: Array<{ roleId: string; emails: string[] }>;
  }>,
) {
  const { data, resolve, reject } = action.payload;
  try {
    const sagasToCall = [];
    const emailSet: Record<string, string[]> = {};
    data.forEach((groupSet: { roleId: string; emails: string[] }) => {
      const { emails, roleId } = groupSet;
      emails.forEach((email: string) => {
        if (emailSet.hasOwnProperty(email)) {
          emailSet[email].push(roleId);
        } else {
          emailSet[email] = [roleId];
        }
      });
    });

    for (const email in emailSet) {
      sagasToCall.push(
        call(inviteUser, { email, groupIds: emailSet[email] }, reject),
      );
    }
    yield all(sagasToCall);
    yield put({
      type: ReduxActionTypes.INVITE_USERS_TO_ORG_SUCCESS,
      payload: {
        inviteCount: sagasToCall.length,
      },
    });
    yield call(resolve);
  } catch (error) {
    console.log(error);
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

export function* fetchUserSaga(action: ReduxAction<FetchUserRequest>) {
  try {
    const request: FetchUserRequest = action.payload;
    const response: FetchUserResponse = yield call(UserApi.fetchUser, request);
    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      const { user, applications, currentOrganization } = response.data;
      const finalData = {
        ...user,
        applications,
        currentOrganization,
      };
      AnalyticsUtil.identifyUser(finalData.id, finalData);
      Sentry.configureScope(function(scope) {
        scope.setUser({ email: finalData.email, id: finalData.id });
      });
      yield put({
        type: ReduxActionTypes.FETCH_USER_SUCCESS,
        payload: finalData,
      });
      return yield finalData;
    }
    return yield false;
  } catch (error) {
    console.log(error);
    if (error) {
      yield put({
        type: ReduxActionErrorTypes.FETCH_USER_ERROR,
        payload: {
          error,
        },
      });
    }
  }
}

export function* setCurrentUserSaga(action: ReduxAction<FetchUserRequest>) {
  const me = yield call(fetchUserSaga, action);
  if (me) {
    resetAuthExpiration();
    yield put({
      type: ReduxActionTypes.SET_CURRENT_USER_SUCCESS,
      payload: me,
    });
    yield call(fetchOrgsSaga);
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
      yield put(fetchCurrentUser());
    }
  } catch (error) {
    console.log(error);
    yield put(logoutUserError(error));
  }
}

export default function* userSagas() {
  yield all([
    takeLatest(ReduxActionTypes.CREATE_USER_INIT, createUserSaga),
    takeLatest(ReduxActionTypes.FORGOT_PASSWORD_INIT, forgotPasswordSaga),
    takeLatest(ReduxActionTypes.RESET_USER_PASSWORD_INIT, resetPasswordSaga),
    takeLatest(
      ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_INIT,
      verifyResetPasswordTokenSaga,
    ),
    takeLatest(ReduxActionTypes.INVITE_USERS_TO_ORG_INIT, inviteUsers),
    takeLatest(ReduxActionTypes.FETCH_USER_INIT, fetchUserSaga),
    takeLatest(ReduxActionTypes.SET_CURRENT_USER_INIT, setCurrentUserSaga),
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
