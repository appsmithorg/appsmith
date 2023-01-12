import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { call, put } from "redux-saga/effects"
import { ApiResponse } from "api/ApiResponses"
import { TenantApi } from "@appsmith/api/TenantApi"
import { validateResponse } from "sagas/ErrorSagas"

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
  }
}
