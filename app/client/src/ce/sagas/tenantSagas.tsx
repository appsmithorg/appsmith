import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { call, put } from "redux-saga/effects";
import type { ApiResponse } from "api/ApiResponses";
import { TenantApi } from "@appsmith/api/TenantApi";
import { validateResponse } from "sagas/ErrorSagas";
import { ERROR_CODES } from "ce/constants/ApiConstants";

// On CE we don't expose tenant config so this shouldn't make any API calls and should just return necessary permissions for the user
export function* fetchCurrentTenantConfigSaga() {
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

    // tenant api is UI blocking call, we have to safe crash the app if it fails
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: ERROR_CODES.SERVER_ERROR,
      },
    });
  }
}
