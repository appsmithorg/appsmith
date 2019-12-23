import { call, takeLatest, put, all } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import UserApi, {
  CreateUserRequest,
  CreateUserResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordVerifyTokenRequest,
  FetchUserRequest,
  FetchUserResponse,
} from "api/UserApi";
import { ApiResponse } from "api/ApiResponses";
import {
  validateResponse,
  getResponseErrorMessage,
  callAPI,
} from "./ErrorSagas";

import { fetchOrgsSaga } from "./OrgSagas";

import { resetAuthExpiration } from "utils/storage";

export function* createUserSaga(
  action: ReduxAction<{
    resolve: any;
    reject: any;
    email: string;
    password: string;
  }>,
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
  action: ReduxAction<{ resolve: any; reject: any; email: string }>,
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
  action: ReduxAction<{
    resolve: any;
    reject: any;
    email: string;
    token: string;
    password: string;
  }>,
) {
  const { email, token, password, resolve, reject } = action.payload;
  try {
    const request: ResetPasswordRequest = {
      user: {
        email,
        password,
      },
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
  action: ReduxAction<{
    data: Array<{ roleId: string; emails: string[] }>;
    resolve: any;
    reject: any;
  }>,
) {
  try {
    const { data, resolve, reject } = action.payload;
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
    yield put({
      type: ReduxActionErrorTypes.INVITE_USERS_TO_ORG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* verifyResetPasswordTokenSaga(
  action: ReduxAction<{ token: string; email: string }>,
) {
  try {
    const request: ResetPasswordVerifyTokenRequest = action.payload;
    const response: ApiResponse = yield callAPI(
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

export function* fetchUserSaga(action: ReduxAction<FetchUserRequest>) {
  try {
    const request: FetchUserRequest = action.payload;
    const response: FetchUserResponse = yield call(UserApi.fetchUser, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_USER_SUCCESS,
        payload: response.data,
      });
      return yield response.data;
    }
    return yield false;
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_ERROR,
    });
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
  ]);
}
