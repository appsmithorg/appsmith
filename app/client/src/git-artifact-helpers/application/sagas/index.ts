import { all, takeLatest } from "redux-saga/effects";
import applicationRedirectToClosestEntitySaga from "./applicationRedirectToClosestEntitySaga";
import applicationConnectToGitSaga from "./applicationConnectToGitSaga";
import {
  gitCheckoutBranchSuccess,
  gitConnectSuccess,
  gitDiscardSuccess,
  gitPullSuccess,
} from "git/store";

export default function* gitApplicationSagas() {
  yield all([
    takeLatest(gitConnectSuccess.type, applicationConnectToGitSaga),
    takeLatest(gitDiscardSuccess.type, applicationRedirectToClosestEntitySaga),
    takeLatest(
      gitCheckoutBranchSuccess.type,
      applicationRedirectToClosestEntitySaga,
    ),
    takeLatest(gitPullSuccess.type, applicationRedirectToClosestEntitySaga),
  ]);
}
