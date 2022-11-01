import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import { put } from "redux-saga/effects";

// On CE we don't expose tenant config so this shouldn't make any API calls and should just return necessary permissions for the user
export function* fetchCurrentTenantConfigSaga() {
  try {
    yield put({
      type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS,
      payload: {
        userPermissions: [PERMISSION_TYPE.CREATE_WORKSPACE],
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR,
      payload: {
        error,
      },
    });
  }
}
