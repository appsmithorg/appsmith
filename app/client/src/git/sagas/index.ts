import { gitArtifactActions } from "git/store/gitArtifactSlice";
import { all, takeLatest } from "redux-saga/effects";
import connectSaga from "./connectSaga";
import commitSaga from "./commitSaga";
import { gitConfigActions } from "git/store/gitConfigSlice";
import fetchGlobalProfileSaga from "./fetchGlobalProfileSaga";
import fetchBranchesSaga from "./fetchBranchesSaga";
import fetchLocalProfileSaga from "./fetchLocalProfileSaga";
import updateLocalProfileSaga from "./updateLocalProfileSaga";
import updateGlobalProfileSaga from "./updateGlobalProfileSaga";

export function* gitSagas() {
  yield all([
    takeLatest(gitArtifactActions.connectInit.type, connectSaga),

    // branches
    takeLatest(gitArtifactActions.fetchBranchesInit.type, fetchBranchesSaga),
    takeLatest(gitArtifactActions.fetchBranchesInit.type, fetchBranchesSaga),

    takeLatest(gitArtifactActions.commitInit.type, commitSaga),
    takeLatest(
      gitArtifactActions.fetchLocalProfileInit.type,
      fetchLocalProfileSaga,
    ),
    takeLatest(
      gitArtifactActions.updateLocalProfileInit.type,
      updateLocalProfileSaga,
    ),
    takeLatest(
      gitConfigActions.fetchGlobalProfileInit.type,
      fetchGlobalProfileSaga,
    ),
    takeLatest(
      gitConfigActions.updateGlobalProfileInit.type,
      updateGlobalProfileSaga,
    ),
  ]);
}
