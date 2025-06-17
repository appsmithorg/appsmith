export * from "ce/sagas/organizationSagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  fetchCurrentOrganizationConfigSaga,
  updateOrganizationConfigSaga,
} from "ce/sagas/organizationSagas";
import { all, takeLatest } from "redux-saga/effects";

export default function* organizationSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_CURRENT_ORGANIZATION_CONFIG,
      fetchCurrentOrganizationConfigSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_ORGANIZATION_CONFIG,
      updateOrganizationConfigSaga,
    ),
  ]);
}
