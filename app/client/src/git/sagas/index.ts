import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { all, takeLatest } from "redux-saga/effects";
import connectSaga from "./connectSaga";
import commitSaga from "./commitSaga";

export function* gitSagas() {
  yield all([
    takeLatest(gitArtifactActions.connectInit, connectSaga),
    takeLatest(gitArtifactActions.commitInit, commitSaga),
  ]);
}
