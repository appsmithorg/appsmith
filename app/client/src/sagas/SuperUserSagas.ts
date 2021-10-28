import UserApi from "api/UserApi";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";
import { User } from "constants/userConstants";
import { takeLatest, all, call, put, delay } from "redux-saga/effects";
import history from "utils/history";
import { validateResponse } from "./ErrorSagas";
import { getAppsmithConfigs } from "configs";

import { ApiResponse } from "api/ApiResponses";

function* FetchAdminSettingsSaga() {
  const response = yield call(UserApi.fetchAdminSettings);
  const isValidResponse = yield validateResponse(response);

  if (isValidResponse) {
    const { appVersion } = getAppsmithConfigs();

    const settings = {
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

function* FetchAdminSettingsErrorSaga() {
  history.push(APPLICATIONS_URL);
}

function* SaveAdminSettingsSaga(action: ReduxAction<Record<string, string>>) {
  const settings = action.payload;
  const response = yield call(UserApi.saveAdminSettings, settings);
  const isValidResponse = yield validateResponse(response);

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
}

const RESTART_POLL_TIMEOUT = 30000;
const RESTART_POLL_INTERVAL = 2000;

function* RestartServerPoll() {
  yield call(UserApi.restartServer);
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

function* SendTestEmail() {
  yield call(UserApi.sendTestEmail);
  Toaster.show({
    text: "Test email sent successfully",
    hideProgressBar: false,
    variant: Variant.success,
  });
}

function* InitSuperUserSaga(action: ReduxAction<User>) {
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
