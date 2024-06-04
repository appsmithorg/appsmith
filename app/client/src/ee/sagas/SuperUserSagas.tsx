export * from "ce/sagas/SuperUserSagas";
import {
  FetchAdminSettingsSaga,
  FetchAdminSettingsErrorSaga,
  SaveAdminSettingsSaga,
  RestartServerPoll,
  RestryRestartServerPoll,
  SendTestEmail,
} from "ce/sagas/SuperUserSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { User } from "constants/userConstants";
import { takeLatest, all, select } from "redux-saga/effects";
import { getCurrentUser } from "selectors/usersSelectors";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { getShowAdminSettings } from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";

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
