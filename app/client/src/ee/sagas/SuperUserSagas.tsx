export * from "ce/sagas/SuperUserSagas";
import {
  FetchAdminSettingsSaga,
  FetchAdminSettingsErrorSaga,
  SaveAdminSettingsSaga,
  RestartServerPoll,
  RestryRestartServerPoll,
  SendTestEmail,
} from "ce/sagas/SuperUserSagas";
import type { FetchSamlMetadataPayload } from "@appsmith/api/UserApi";
import UserApi from "@appsmith/api/UserApi";
import { toast } from "design-system";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { User } from "constants/userConstants";
import { takeLatest, all, call, put, delay } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import type { ApiResponse } from "api/ApiResponses";
import {
  MIGRATION_STATUS,
  RESTART_POLL_INTERVAL,
  RESTART_POLL_TIMEOUT,
} from "@appsmith/constants/tenantConstants";
import {
  TenantApi,
  type FetchCurrentTenantConfigResponse,
} from "@appsmith/api/TenantApi";
import {
  APPLICATIONS_URL,
  WORKSPACE_SETTINGS_LICENSE_PAGE_URL,
} from "constants/routes";

export function* FetchSamlMetadataSaga(
  action: ReduxAction<FetchSamlMetadataPayload>,
) {
  const settings = action.payload;
  try {
    const response: ApiResponse = yield call(
      UserApi.fetchSamlMetadata,
      settings,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      toast.show("Successfully saved", {
        kind: "success",
      });
      yield put({
        type: ReduxActionTypes.FETCH_SAML_METADATA_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS_SUCCESS,
        payload: {
          APPSMITH_SSO_SAML_ENABLED: action.payload.isEnabled,
        },
      });
      yield put({
        type: ReduxActionTypes.RESTART_SERVER_POLL,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_SAML_METADATA_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_SAML_METADATA_ERROR,
    });
  }
}

export function* RestartServerPollMigration(payload: {
  shouldRedirectToBilling: boolean;
  type: string;
}) {
  let pollCount = 0;
  const maxPollCount = RESTART_POLL_TIMEOUT / RESTART_POLL_INTERVAL;
  while (pollCount < maxPollCount) {
    pollCount++;
    yield delay(RESTART_POLL_INTERVAL);
    try {
      const response: FetchCurrentTenantConfigResponse = yield call(
        TenantApi.fetchCurrentTenantConfig,
      );
      if (
        response.responseMeta.status === 200 &&
        response.data?.tenantConfiguration?.migrationStatus ===
          MIGRATION_STATUS.COMPLETED
      ) {
        if (!payload.shouldRedirectToBilling) location.href = APPLICATIONS_URL;
        else location.href = WORKSPACE_SETTINGS_LICENSE_PAGE_URL;
      }
    } catch (e) {}
  }
  yield put({
    type: ReduxActionErrorTypes.RESTART_SERVER_ERROR,
  });
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
      takeLatest(ReduxActionTypes.FETCH_SAML_METADATA, FetchSamlMetadataSaga),
      takeLatest(ReduxActionTypes.RESTART_SERVER_POLL, RestartServerPoll),
      takeLatest(
        ReduxActionTypes.RETRY_RESTART_SERVER_POLL,
        RestryRestartServerPoll,
      ),
      takeLatest(ReduxActionTypes.SEND_TEST_EMAIL, SendTestEmail),
      takeLatest(
        ReduxActionTypes.RESTART_SERVER_POLL_LICENSE_MIGRATION,
        RestartServerPollMigration,
      ),
      takeLatest(
        ReduxActionTypes.RETRY_SERVER_POLL_LICENSE_MIGRATION,
        RestartServerPollMigration,
      ),
    ]);
  }
}

export default function* SuperUserSagas() {
  yield takeLatest(
    ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
    InitSuperUserSaga,
  );
}
