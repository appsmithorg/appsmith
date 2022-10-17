export * from "ce/sagas/tenantSagas";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { fetchCurrentTenantConfigSaga } from "ce/sagas/tenantSagas";
import { all, takeLatest } from "redux-saga/effects";

export default function* tenantSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
      fetchCurrentTenantConfigSaga,
    ),
  ]);
}
