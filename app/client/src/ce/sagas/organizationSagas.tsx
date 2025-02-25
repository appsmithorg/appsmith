import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import { call, put } from "redux-saga/effects";
import type { APIResponseError, ApiResponse } from "api/ApiResponses";
import type { UpdateOrganizationConfigRequest } from "ee/api/OrganizationApi";
import { OrganizationApi } from "ee/api/OrganizationApi";
import { validateResponse } from "sagas/ErrorSagas";
import { safeCrashAppRequest } from "actions/errorActions";
import { ERROR_CODES } from "ee/constants/ApiConstants";
import { defaultBrandingConfig as CE_defaultBrandingConfig } from "ee/reducers/organizationReducer";
import { toast } from "@appsmith/ads";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getFromServerWhenNoPrefetchedResult } from "sagas/helper";

// On CE we don't expose organization config so this shouldn't make any API calls and should just return necessary permissions for the user
export function* fetchCurrentOrganizationConfigSaga(action?: {
  payload?: { organizationConfig?: ApiResponse };
}) {
  const organizationConfig = action?.payload?.organizationConfig;

  try {
    const response: ApiResponse = yield call(
      getFromServerWhenNoPrefetchedResult,
      organizationConfig,
      () => call(OrganizationApi.fetchCurrentOrganizationConfig),
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = response.data;

      yield put({
        type: ReduxActionTypes.FETCH_CURRENT_ORGANIZATION_CONFIG_SUCCESS,
        payload: data,
      });
      AnalyticsUtil.initInstanceId(data.instanceId);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CURRENT_ORGANIZATION_CONFIG_ERROR,
      payload: {
        error,
      },
    });

    // organization api is UI blocking call, we have to safe crash the app if it fails
    yield put(safeCrashAppRequest());
  }
}

export function* updateOrganizationConfigSaga(
  action: ReduxAction<UpdateOrganizationConfigRequest>,
) {
  try {
    const settings = action.payload.organizationConfiguration;
    const hasSingleSessionUserSetting = settings.hasOwnProperty(
      "singleSessionPerUserEnabled",
    );
    const hasShowRolesAndGroupsSetting =
      settings.hasOwnProperty("showRolesAndGroups");

    const hasEmailVerificationSetting = settings.hasOwnProperty(
      "emailVerificationEnabled",
    );

    const response: ApiResponse = yield call(
      OrganizationApi.updateOrganizationConfig,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = response.data as any;

      if (hasSingleSessionUserSetting || hasShowRolesAndGroupsSetting) {
        AnalyticsUtil.logEvent("GENERAL_SETTINGS_UPDATE", {
          ...(hasSingleSessionUserSetting
            ? { session_limit_enabled: settings["singleSessionPerUserEnabled"] }
            : {}),
          ...(hasShowRolesAndGroupsSetting
            ? {
                programmatic_access_control_enabled:
                  settings["showRolesAndGroups"],
              }
            : {}),
        });
      }

      if (hasEmailVerificationSetting) {
        AnalyticsUtil.logEvent("EMAIL_VERIFICATION_SETTING_UPDATE", {
          enabled: settings["emailVerificationEnabled"],
        });
      }

      // If the organization config is not present, we need to set the default config
      yield put({
        type: ReduxActionTypes.UPDATE_ORGANIZATION_CONFIG_SUCCESS,
        payload: {
          ...payload,
          organizationConfiguration: {
            ...CE_defaultBrandingConfig,
            ...payload.organizationConfiguration,
          },
        },
      });

      if (action.payload.isOnlyOrganizationSettings) {
        toast.show("Successfully saved", {
          kind: "success",
        });
      }

      if (action.payload.needsRefresh) {
        location.reload();
      }
    }
  } catch (error) {
    const errorObj = error as APIResponseError;

    yield put({
      type: ReduxActionErrorTypes.UPDATE_ORGANIZATION_CONFIG_ERROR,
      payload: {
        errorObj,
      },
    });
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: errorObj?.code ?? ERROR_CODES.SERVER_ERROR,
      },
    });
  }
}
