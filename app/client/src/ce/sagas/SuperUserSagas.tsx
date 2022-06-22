import React from "react";
import UserApi, { SendTestEmailPayload } from "@appsmith/api/UserApi";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";
import { User } from "constants/userConstants";
import { takeLatest, all, call, put, delay, select } from "redux-saga/effects";
import history from "utils/history";
import { validateResponse } from "sagas/ErrorSagas";
import { getAppsmithConfigs } from "@appsmith/configs";

import { ApiResponse } from "api/ApiResponses";
import {
  createMessage,
  TEST_EMAIL_FAILURE,
  TEST_EMAIL_SUCCESS,
  TEST_EMAIL_SUCCESS_TROUBLESHOOT,
} from "@appsmith/constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import { EMAIL_SETUP_DOC } from "constants/ThirdPartyConstants";

export function* FetchAdminSettingsSaga() {
  const response: ApiResponse = yield call(UserApi.fetchAdminSettings);
  const isValidResponse: boolean = yield validateResponse(response);

  if (isValidResponse) {
    const { appVersion } = getAppsmithConfigs();

    const settings = {
      //@ts-expect-error: response is of type unknown
      ...response.data,
      APPSMITH_CURRENT_VERSION: appVersion.id,
    };
    yield put({
      type: ReduxActionTypes.FETCH_ADMIN_SETTINGS_SUCCESS,
      payload: settings,
    });
  } else {
    yield put({
      type: ReduxActionTypes.FETCH_ADMIN_SETTINGS_ERROR,
      payload: response,
    });
  }
}

export function* FetchAdminSettingsErrorSaga() {
  history.push(APPLICATIONS_URL);
}

export function* SaveAdminSettingsSaga(
  action: ReduxAction<Record<string, string>>,
) {
  const settings = action.payload;
  try {
    const response: ApiResponse = yield call(
      UserApi.saveAdminSettings,
      settings,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      Toaster.show({
        text: "Successfully Saved",
        variant: Variant.success,
      });
      yield put({
        type: ReduxActionTypes.SAVE_ADMIN_SETTINGS_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS_SUCCESS,
        payload: settings,
      });
      yield put({
        type: ReduxActionTypes.RESTART_SERVER_POLL,
      });
    } else {
      yield put({
        type: ReduxActionTypes.SAVE_ADMIN_SETTINGS_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.SAVE_ADMIN_SETTINGS_ERROR,
    });
  }
}

const RESTART_POLL_TIMEOUT = 2 * 60 * 1000;
const RESTART_POLL_INTERVAL = 2000;

export function* RestartServerPoll() {
  yield call(UserApi.restartServer);
  yield call(RestryRestartServerPoll);
}

function* RestryRestartServerPoll() {
  let pollCount = 0;
  const maxPollCount = RESTART_POLL_TIMEOUT / RESTART_POLL_INTERVAL;
  while (pollCount < maxPollCount) {
    pollCount++;
    yield delay(RESTART_POLL_INTERVAL);
    try {
      const response: ApiResponse = yield call(UserApi.getCurrentUser);
      if (response.responseMeta.status === 200) {
        window.location.reload();
      }
    } catch (e) {}
  }
  yield put({
    type: ReduxActionErrorTypes.RESTART_SERVER_ERROR,
  });
}

export function* SendTestEmail(action: ReduxAction<SendTestEmailPayload>) {
  try {
    const response: ApiResponse = yield call(
      UserApi.sendTestEmail,
      action.payload,
    );
    const currentUser: User | undefined = yield select(getCurrentUser);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      let actionElement;
      if (response.data) {
        actionElement = (
          <>
            <br />
            <span onClick={() => window.open(EMAIL_SETUP_DOC, "blank")}>
              {createMessage(TEST_EMAIL_SUCCESS_TROUBLESHOOT)}
            </span>
          </>
        );
      }
      Toaster.show({
        actionElement,
        text: createMessage(
          response.data
            ? // @ts-expect-error: currentUser can be undefined
              TEST_EMAIL_SUCCESS(currentUser?.email)
            : TEST_EMAIL_FAILURE,
        ),
        hideProgressBar: true,
        variant: response.data ? Variant.info : Variant.danger,
      });
    }
  } catch (e) {}
}

export function* InitSuperUserSaga(action: ReduxAction<User>) {
  const user = action.payload;
  if (user.isSuperUser) {
    yield all([
      takeLatest(ReduxActionTypes.FETCH_ADMIN_SETTINGS, FetchAdminSettingsSaga),
      takeLatest(
        ReduxActionTypes.FETCH_ADMIN_SETTINGS_ERROR,
        FetchAdminSettingsErrorSaga,
      ),
      takeLatest(ReduxActionTypes.SAVE_ADMIN_SETTINGS, SaveAdminSettingsSaga),
      takeLatest(ReduxActionTypes.RESTART_SERVER_POLL, RestartServerPoll),
      takeLatest(
        ReduxActionTypes.RETRY_RESTART_SERVER_POLL,
        RestryRestartServerPoll,
      ),
      takeLatest(ReduxActionTypes.SEND_TEST_EMAIL, SendTestEmail),
    ]);
  }
}

export default function* SuperUserSagas() {
  yield takeLatest(
    ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
    InitSuperUserSaga,
  );
}
