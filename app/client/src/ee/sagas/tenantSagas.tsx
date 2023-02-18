export * from "ce/sagas/tenantSagas";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  all,
  call,
  cancel,
  delay,
  fork,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import { ApiResponse } from "api/ApiResponses";
import { TenantApi } from "@appsmith/api/TenantApi";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";
import { TenantReduxState, License } from "@appsmith/reducers/tenantReducer";
import localStorage from "utils/localStorage";
import { defaultBrandingConfig as CE_defaultBrandingConfig } from "ce/reducers/tenantReducer";
import {
  ADMIN_SETTINGS_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  LICENSE_CHECK_PATH,
  PAGE_NOT_FOUND_URL,
  SETUP,
  USER_AUTH_URL,
  VIEWER_PATH,
  VIEWER_PATH_DEPRECATED,
} from "constants/routes";
import { selectFeatureFlags } from "selectors/usersSelectors";
import { matchPath } from "react-router";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { Toaster, Variant } from "design-system-old";
import {
  createMessage,
  LICENSE_UPDATED_SUCCESSFULLY,
} from "@appsmith/constants/messages";
import { showLicenseModal } from "@appsmith/actions/tenantActions";

export function* fetchCurrentTenantConfigSaga(): any {
  try {
    const response: ApiResponse<TenantReduxState<License>> = yield call(
      TenantApi.fetchCurrentTenantConfig,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const payload = response.data as any;

      // If the tenant config is not present, we need to set the default config
      yield put({
        type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
        payload: {
          ...payload,
          tenantConfiguration: {
            ...CE_defaultBrandingConfig,
            ...payload.tenantConfiguration,
          },
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* startLicenseStatusCheckSaga() {
  const urlObject = new URL(window.location.href);
  const redirectUrl = urlObject?.searchParams.get("redirectUrl");
  const shouldEnableFirstTimeUserOnboarding = urlObject?.searchParams.get(
    "enableFirstTimeUserExperience",
  );

  while (true) {
    try {
      const response: ApiResponse<TenantReduxState<License>> = yield call(
        TenantApi.fetchCurrentTenantConfig,
      );
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
          payload: response.data,
        });
      }
      if (!response.data?.tenantConfiguration?.license?.active) {
        yield put({ type: ReduxActionTypes.STOP_LICENSE_STATUS_CHECK });
        if (redirectUrl) {
          history.replace(
            `${LICENSE_CHECK_PATH}?redirectUrl=${redirectUrl}&enableFirstTimeUserExperience=${shouldEnableFirstTimeUserOnboarding}}`,
          );
        } else {
          history.replace(LICENSE_CHECK_PATH);
        }
      }
    } catch (error) {
      yield put({
        type: ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR,
        payload: {
          error,
        },
      });
    }
    yield delay(60 * 60 * 1000);
  }
}

export function* validateLicenseSaga(
  action: ReduxAction<{ key: string }>,
): any {
  const urlObject = new URL(window.location.href);
  const redirectUrl =
    urlObject?.searchParams.get("redirectUrl") ?? "/applications";
  const shouldEnableFirstTimeUserOnboarding = urlObject?.searchParams.get(
    "enableFirstTimeUserExperience",
  );
  const adminSettingsPath = `${ADMIN_SETTINGS_PATH}/${SettingCategories.BILLING}`;
  const shouldRedirectOnUpdate = urlObject?.pathname !== adminSettingsPath;
  try {
    const response: ApiResponse<TenantReduxState<License>> = yield call(
      TenantApi.validateLicense,
      action?.payload.key,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      if (response?.data?.tenantConfiguration?.license?.active) {
        shouldRedirectOnUpdate && window.location.replace(redirectUrl);
        if (shouldEnableFirstTimeUserOnboarding) {
          const urlObject = new URL(redirectUrl);
          const match = matchPath<{
            pageId: string;
            applicationId: string;
          }>(urlObject?.pathname ?? redirectUrl, {
            path: [
              BUILDER_PATH,
              BUILDER_PATH_DEPRECATED,
              VIEWER_PATH,
              VIEWER_PATH_DEPRECATED,
            ],
            strict: false,
            exact: false,
          });
          const { applicationId, pageId } = match?.params || {};
          yield put({
            type: ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
            payload: {
              applicationId: applicationId,
              pageId: pageId,
            },
          });
        }
      }
      initLicenseStatusCheckSaga();
      yield put({
        type: ReduxActionTypes.VALIDATE_LICENSE_KEY_SUCCESS,
        payload: response.data,
      });
      if (!shouldRedirectOnUpdate) {
        Toaster.show({
          text: createMessage(LICENSE_UPDATED_SUCCESSFULLY),
          variant: Variant.success,
        });
        yield put(showLicenseModal(false));
      }
    } else {
      yield put({
        type: ReduxActionErrorTypes.VALIDATE_LICENSE_KEY_ERROR,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.VALIDATE_LICENSE_KEY_ERROR,
      payload: {
        error,
      },
    });
  }
}

/**
 * saves the tenant config in local storage
 *
 * @param action
 */
export function cacheTenentConfigSaga(action: ReduxAction<any>) {
  localStorage.setItem(
    "tenantConfig",
    JSON.stringify(action.payload.tenantConfiguration),
  );
}

export function* initLicenseStatusCheckSaga(): unknown {
  const features = yield select(selectFeatureFlags);
  const url = new URL(window.location.href);

  const skipLicenseCheck =
    url.pathname.includes(USER_AUTH_URL) ||
    url.pathname.includes(SETUP) ||
    url.pathname.includes(PAGE_NOT_FOUND_URL);

  if (!skipLicenseCheck && features?.USAGE_AND_BILLING) {
    const task = yield fork(startLicenseStatusCheckSaga);
    yield take(ReduxActionTypes.STOP_LICENSE_STATUS_CHECK);
    yield cancel(task);
  }
}

export default function* tenantSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
      fetchCurrentTenantConfigSaga,
    ),
    takeLatest(ReduxActionTypes.VALIDATE_LICENSE_KEY, validateLicenseSaga),
    takeLatest(
      ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
      initLicenseStatusCheckSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
      cacheTenentConfigSaga,
    ),
  ]);
}
