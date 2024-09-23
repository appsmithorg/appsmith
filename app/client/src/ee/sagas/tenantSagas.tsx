export * from "ce/sagas/tenantSagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  fetchCurrentTenantConfigSaga,
  updateTenantConfigSaga,
} from "ce/sagas/tenantSagas";
import { all, takeLatest } from "redux-saga/effects";

export default function* tenantSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
      fetchCurrentTenantConfigSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_TENANT_CONFIG, updateTenantConfigSaga),
  ]);
}
