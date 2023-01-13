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
  put,
  takeLatest,
  take,
  fork,
  select,
} from "redux-saga/effects";
import { ApiResponse } from "api/ApiResponses";
import { TenantApi } from "@appsmith/api/TenantApi";
import { validateResponse } from "sagas/ErrorSagas";
import log from "loglevel";
import { getCurrentUser, selectFeatureFlags } from "selectors/usersSelectors";
import history from "utils/history";
import { TenantReduxState, License } from "@appsmith/reducers/tenantReducer";

export function* fetchCurrentTenantConfigSaga(): any {
  try {
    const response: ApiResponse = yield call(
      TenantApi.fetchCurrentTenantConfig,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    const features = yield select(selectFeatureFlags);
    const user = yield select(getCurrentUser);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
        payload: response.data,
      });
    }
    const url = new URL(window.location.href);
    const isAuthPageOrWelcomePage =
      url.pathname.includes("/user") || url.pathname.includes("/setup/");
    if (!isAuthPageOrWelcomePage && user) {
      if (features?.USAGE_AND_BILLING) {
        const task = yield fork(checkLicenseStatus);
        yield take(ReduxActionTypes.CANCEL_LICENSE_VALIDATION);
        yield cancel(task);
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
}

export function* checkLicenseStatus(): any {
  while (true) {
    try {
      const response: ApiResponse = yield call(
        TenantApi.fetchCurrentTenantConfig,
      );
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
          payload: response.data,
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
    yield delay(60 * 60 * 1000);
  }
}

export function* validateLicenseSaga(action?: ReduxAction<any>): any {
  try {
    const response: ApiResponse<TenantReduxState<License>> = yield call(
      TenantApi.validateLicense,
      action?.payload.key,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.VALIDATE_LICENSE_KEY_SUCCESS,
        payload: response.data,
      });
      if (response?.data?.tenantConfiguration?.license?.active) {
        history.push("/applications");
        yield delay(15000);
        yield put({
          type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
        });
      }
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

export default function* tenantSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
      fetchCurrentTenantConfigSaga,
    ),
    takeLatest(ReduxActionTypes.VALIDATE_LICENSE_KEY, validateLicenseSaga),
  ]);
}
