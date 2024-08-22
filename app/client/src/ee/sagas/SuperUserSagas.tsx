import {
  FetchAdminSettingsErrorSaga,
  FetchAdminSettingsSaga,
  RestartServerPoll,
  RestryRestartServerPoll,
  SaveAdminSettingsSaga,
  SendTestEmail,
} from "ce/sagas/SuperUserSagas";
import type { User } from "constants/userConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { getShowAdminSettings } from "ee/utils/BusinessFeatures/adminSettingsHelpers";
import { isGACEnabled } from "ee/utils/planHelpers";
import { all, select, takeLatest } from "redux-saga/effects";
import { getCurrentUser } from "selectors/usersSelectors";

export * from "ce/sagas/SuperUserSagas";

export function* InitSuperUserSaga() {
  const user: User = yield select(getCurrentUser);
  const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
  const isFeatureEnabled = isGACEnabled(featureFlags);

  if (getShowAdminSettings(isFeatureEnabled, user)) {
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
    ReduxActionTypes.END_CONSOLIDATED_PAGE_LOAD,
    InitSuperUserSaga,
  );
}
