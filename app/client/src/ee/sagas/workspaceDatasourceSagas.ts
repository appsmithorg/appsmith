export * from "ce/sagas/workspaceDatasourceSagas";

import { startWorkspaceDatasource } from "ce/sagas/workspaceDatasourceSagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";

export default function* workspaceDatasourceSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.INITIALIZE_WORKSPACE_DATASOURCE,
      startWorkspaceDatasource,
    ),
  ]);
}
