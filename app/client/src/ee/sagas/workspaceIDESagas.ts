export * from "ce/sagas/workspaceIDESagas";

import {
  fetchWorkspaceDatasourceUsageSaga,
  startWorkspaceIDE,
} from "ce/sagas/workspaceIDESagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";

export default function* workspaceIDESagas() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_WORKSPACE_IDE, startWorkspaceIDE),
    takeLatest(
      ReduxActionTypes.FETCH_WORKSPACE_DATASOURCE_USAGE_INIT,
      fetchWorkspaceDatasourceUsageSaga,
    ),
  ]);
}
