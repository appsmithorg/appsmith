import type { SendTestEmailPayload } from "ee/api/UserApi";
import UserApi from "ee/api/UserApi";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";
import type { User } from "constants/userConstants";
import { call, put, delay, select } from "redux-saga/effects";
import history from "utils/history";
import { validateResponse } from "sagas/ErrorSagas";
import { getAppsmithConfigs } from "ee/configs";

import type { ApiResponse } from "api/ApiResponses";
import {
  APPSMITH_DISPLAY_VERSION,
  createMessage,
  TEST_EMAIL_FAILURE,
  TEST_EMAIL_SUCCESS,
  TEST_EMAIL_SUCCESS_TROUBLESHOOT,
} from "ee/constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import { EMAIL_SETUP_DOC } from "constants/ThirdPartyConstants";
import { toast } from "@appsmith/ads";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  MIGRATION_STATUS,
  RESTART_POLL_INTERVAL,
  RESTART_POLL_TIMEOUT,
} from "ee/constants/tenantConstants";
import type { FetchCurrentTenantConfigResponse } from "ee/api/TenantApi";
import TenantApi from "ee/api/TenantApi";

export function* FetchAdminSettingsSaga() {
  const response: ApiResponse = yield call(UserApi.fetchAdminSettings);
  const isValidResponse: boolean = yield validateResponse(response);

  if (isValidResponse) {
    const { appVersion } = getAppsmithConfigs();
    const settings = {
      //@ts-expect-error: response is of type unknown
      ...response.data,
      APPSMITH_CURRENT_VERSION: createMessage(
        APPSMITH_DISPLAY_VERSION,
        appVersion.edition,
        appVersion.id,
      ),
    };

    // Converting empty values to boolean false
    Object.keys(settings).forEach((key) => {
      if ((settings[key] as string).trim() === "") {
        settings[key] = false;
      }
    });

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
  action: ReduxAction<{
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings: Record<string, any>;
    needsRestart: boolean;
  }>,
) {
  const { needsRestart = true, settings } = action.payload;

  try {
    const hasDisableTelemetrySetting = settings.hasOwnProperty(
      "APPSMITH_DISABLE_TELEMETRY",
    );
    const hasHideWatermarkSetting = settings.hasOwnProperty(
      "APPSMITH_HIDE_WATERMARK",
    );
    const response: ApiResponse = yield call(
      UserApi.saveAdminSettings,
      settings,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      toast.show("Successfully saved", {
        kind: "success",
      });

      if (settings["APPSMITH_DISABLE_TELEMETRY"]) {
        AnalyticsUtil.logEvent("TELEMETRY_DISABLED");
      }

      if (hasDisableTelemetrySetting || hasHideWatermarkSetting) {
        AnalyticsUtil.logEvent("GENERAL_SETTINGS_UPDATE", {
          ...(hasDisableTelemetrySetting
            ? { telemetry_disabled: settings["APPSMITH_DISABLE_TELEMETRY"] }
            : {}),
          ...(hasHideWatermarkSetting
            ? { watermark_disabled: settings["APPSMITH_HIDE_WATERMARK"] }
            : {}),
        });
      }

      yield put({
        type: ReduxActionTypes.SAVE_ADMIN_SETTINGS_SUCCESS,
      });

      yield put({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS_SUCCESS,
        payload: settings,
      });

      if (needsRestart) {
        yield put({
          type: ReduxActionTypes.RESTART_SERVER_POLL,
        });
      }
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

export function* RestartServerPoll() {
  yield call(UserApi.restartServer);
  yield call(RestryRestartServerPoll);
}

export function* RestryRestartServerPoll() {
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
      if (response.data) {
      }
      toast.show(
        createMessage(
          response.data
            ? // @ts-expect-error: currentUser can be undefined
              TEST_EMAIL_SUCCESS(currentUser?.email)
            : TEST_EMAIL_FAILURE,
        ),
        {
          kind: response.data ? "info" : "error",
          action: {
            text: createMessage(TEST_EMAIL_SUCCESS_TROUBLESHOOT),
            effect: () => window.open(EMAIL_SETUP_DOC, "blank"),
          },
        },
      );
    }
  } catch (e) {}
}
