import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { call, put } from "redux-saga/effects";
import type { APIResponseError, ApiResponse } from "api/ApiResponses";
import type { UpdateTenantConfigRequest } from "@appsmith/api/TenantApi";
import { TenantApi } from "@appsmith/api/TenantApi";
import { validateResponse } from "sagas/ErrorSagas";
import { safeCrashAppRequest } from "actions/errorActions";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { defaultBrandingConfig as CE_defaultBrandingConfig } from "@appsmith/reducers/tenantReducer";
import { toast } from "design-system";
import AnalyticsUtil from "utils/AnalyticsUtil";

// On CE we don't expose tenant config so this shouldn't make any API calls and should just return necessary permissions for the user
export function* fetchCurrentTenantConfigSaga() {
  try {
    const response: ApiResponse = yield call(
      TenantApi.fetchCurrentTenantConfig,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const data: any = response.data;
      yield put({
        type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
        payload: data,
      });
      AnalyticsUtil.initInstanceId(data.instanceId);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR,
      payload: {
        error,
      },
    });

    // tenant api is UI blocking call, we have to safe crash the app if it fails
    yield put(safeCrashAppRequest());
  }
}

export function* updateTenantConfigSaga(
  action: ReduxAction<UpdateTenantConfigRequest>,
) {
  try {
    const settings = action.payload.tenantConfiguration;
    const hasSingleSessionUserSetting = settings.hasOwnProperty(
      "singleSessionPerUserEnabled",
    );
    const hasShowRolesAndGroupsSetting =
      settings.hasOwnProperty("showRolesAndGroups");

    const hasEmailVerificationSetting = settings.hasOwnProperty(
      "emailVerificationEnabled",
    );

    const response: ApiResponse = yield call(
      TenantApi.updateTenantConfig,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
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

      // If the tenant config is not present, we need to set the default config
      yield put({
        type: ReduxActionTypes.UPDATE_TENANT_CONFIG_SUCCESS,
        payload: {
          ...payload,
          tenantConfiguration: {
            ...CE_defaultBrandingConfig,
            ...payload.tenantConfiguration,
          },
        },
      });

      if (action.payload.isOnlyTenantSettings) {
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
      type: ReduxActionErrorTypes.UPDATE_TENANT_CONFIG_ERROR,
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
