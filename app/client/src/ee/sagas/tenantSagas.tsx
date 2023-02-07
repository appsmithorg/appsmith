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
import log from "loglevel";
import history from "utils/history";
import { TenantReduxState, License } from "@appsmith/reducers/tenantReducer";
import localStorage from "utils/localStorage";
import { defaultBrandingConfig as CE_defaultBrandingConfig } from "ce/reducers/tenantReducer";
import { LICENSE_CHECK_PATH, SETUP, USER_AUTH_URL } from "constants/routes";
import { getLicenseDetails } from "@appsmith/selectors/tenantSelectors";
import { selectFeatureFlags } from "selectors/usersSelectors";

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
          history.replace(`${LICENSE_CHECK_PATH}?redirectUrl=${redirectUrl}`);
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

  try {
    const response: ApiResponse<TenantReduxState<License>> = yield call(
      TenantApi.validateLicense,
      action?.payload.key,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      if (response?.data?.tenantConfiguration?.license?.active) {
        window.location.replace(redirectUrl);
        yield delay(15000);
        yield put({
          type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
        });
      }
      yield put({
        type: ReduxActionTypes.VALIDATE_LICENSE_KEY_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.VALIDATE_LICENSE_KEY_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.VALIDATE_LICENSE_KEY_ERROR,
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
  const license = yield select(getLicenseDetails);
  const url = new URL(window.location.href);
  const redirectUrl = url?.searchParams.get("redirectUrl");
  const isAuthPageOrWelcomePage =
    url.pathname.includes(USER_AUTH_URL) ||
    url.pathname.includes(SETUP) ||
    url.pathname.includes(LICENSE_CHECK_PATH);

  if (!isAuthPageOrWelcomePage && features?.USAGE_AND_BILLING) {
    const task = yield fork(startLicenseStatusCheckSaga);
    yield take(ReduxActionTypes.STOP_LICENSE_STATUS_CHECK);
    yield cancel(task);
    if (!license?.active) {
      yield cancel(task);
      if (redirectUrl) {
        history.replace(`${LICENSE_CHECK_PATH}?redirectUrl=${redirectUrl}`);
      } else {
        history.replace(LICENSE_CHECK_PATH);
      }
    }
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
