export * from "ce/sagas/tenantSagas";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { all, call, put, takeLatest } from "redux-saga/effects";
import { ApiResponse } from "api/ApiResponses";
import { TenantApi } from "@appsmith/api/TenantApi";
import { validateResponse } from "sagas/ErrorSagas";

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
  }
}

export default function* tenantSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
      fetchCurrentTenantConfigSaga,
    ),
  ]);
}
