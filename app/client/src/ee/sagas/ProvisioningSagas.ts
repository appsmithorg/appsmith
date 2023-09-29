import type { DisconnectProvisioningRequest } from "@appsmith/api/ProvisioningApi";
import ProvisioningApi from "@appsmith/api/ProvisioningApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { takeLatest, all, call, put, select } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import type { ApiResponse } from "api/ApiResponses";
import type { User } from "constants/userConstants";
import log from "loglevel";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { getShowAdminSettings } from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";

export function* fetchProvisioningStatusSaga() {
  try {
    const response: ApiResponse = yield call(
      ProvisioningApi.fetchProvisioningStatus,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PROVISIONING_STATUS_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_PROVISIONING_STATUS_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROVISIONING_STATUS_ERROR,
    });
  }
}

export function* disconnectProvisioningStatusSaga(
  action: ReduxAction<DisconnectProvisioningRequest>,
) {
  try {
    const response: ApiResponse = yield call(
      ProvisioningApi.disconnectProvisioning,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DISCONNECT_PROVISIONING_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.DISCONNECT_PROVISIONING_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.DISCONNECT_PROVISIONING_ERROR,
    });
  }
}

export function* generateProvisioningApiKeySaga(
  action: ReduxAction<{ configuredStatus: boolean }>,
) {
  try {
    const response: ApiResponse = yield call(
      ProvisioningApi.generateProvisioningToken,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.GENERATE_PROVISIONING_API_KEY_SUCCESS,
        payload: response.data,
      });
      if (action.payload.configuredStatus) {
        yield put({ type: ReduxActionTypes.FETCH_PROVISIONING_STATUS });
      }
    } else {
      yield put({
        type: ReduxActionErrorTypes.GENERATE_PROVISIONING_API_KEY_ERROR,
      });
    }
  } catch (e) {
    log.error(e);
    yield put({
      type: ReduxActionErrorTypes.GENERATE_PROVISIONING_API_KEY_ERROR,
    });
  }
}

export function* InitAclSaga(action: ReduxAction<User>) {
  const user = action.payload;
  const featureFlags: FeatureFlags = yield select(selectFeatureFlags);
  const isFeatureEnabled = isGACEnabled(featureFlags);

  if (getShowAdminSettings(isFeatureEnabled, user)) {
    yield all([
      takeLatest(
        ReduxActionTypes.FETCH_PROVISIONING_STATUS,
        fetchProvisioningStatusSaga,
      ),
      takeLatest(
        ReduxActionTypes.DISCONNECT_PROVISIONING,
        disconnectProvisioningStatusSaga,
      ),
      takeLatest(
        ReduxActionTypes.GENERATE_PROVISIONING_API_KEY,
        generateProvisioningApiKeySaga,
      ),
    ]);
  }
}

export default function* ProvisioningSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS, InitAclSaga);
}
