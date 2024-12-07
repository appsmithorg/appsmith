import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { all, takeLatest } from "redux-saga/effects";
import connectSaga from "./connectSaga";
import commitSaga from "./commitSaga";
import { gitConfigActions } from "git/store/gitConfigSlice";
import fetchGlobalProfileSaga from "./fetchGlobalProfileSaga";

export function* gitSagas() {
  yield all([
    takeLatest(gitArtifactActions.connectInit, connectSaga),
    takeLatest(gitArtifactActions.commitInit, commitSaga),
    takeLatest(gitConfigActions.fetchGlobalProfileInit, fetchGlobalProfileSaga),
  ]);
}
