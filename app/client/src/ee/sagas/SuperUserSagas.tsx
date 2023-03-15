export * from "ce/sagas/SuperUserSagas";
import {
  FetchAdminSettingsSaga,
  FetchAdminSettingsErrorSaga,
  SaveAdminSettingsSaga,
  RestartServerPoll,
  RestryRestartServerPoll,
  SendTestEmail,
} from "ce/sagas/SuperUserSagas";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { User } from "constants/userConstants";
import { takeLatest, all } from "redux-saga/effects";

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
