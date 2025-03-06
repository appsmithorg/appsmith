import { all, takeLatest } from "redux-saga/effects";
import applicationRedirectToClosestEntitySaga from "./applicationRedirectToClosestEntitySaga";
import applicationConnectToGitSaga from "./applicationConnectToGitSaga";
import {
  gitCheckoutBranchSuccess,
  gitConnectSuccess,
  gitDiscardSuccess,
  gitImportSuccess,
  gitPullSuccess,
} from "git/store";
import applicationImportFromGitSaga from "./applicationImportFromGitSaga";

export default function* gitApplicationSagas() {
  yield all([
    takeLatest(gitConnectSuccess.type, applicationConnectToGitSaga),
    takeLatest(gitImportSuccess.type, applicationImportFromGitSaga),
    takeLatest(gitDiscardSuccess.type, applicationRedirectToClosestEntitySaga),
    takeLatest(
      gitCheckoutBranchSuccess.type,
      applicationRedirectToClosestEntitySaga,
    ),
    takeLatest(gitPullSuccess.type, applicationRedirectToClosestEntitySaga),
  ]);
}
