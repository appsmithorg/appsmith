import { gitArtifactActions } from "git/store/gitArtifactSlice";
import {
  actionChannel,
  call,
  fork,
  take,
  takeLatest,
} from "redux-saga/effects";
import connectSaga from "./connectSaga";
import commitSaga from "./commitSaga";
import { gitConfigActions } from "git/store/gitConfigSlice";
import fetchGlobalProfileSaga from "./fetchGlobalProfileSaga";
import fetchBranchesSaga from "./fetchBranchesSaga";
import fetchLocalProfileSaga from "./fetchLocalProfileSaga";
import updateLocalProfileSaga from "./updateLocalProfileSaga";
import updateGlobalProfileSaga from "./updateGlobalProfileSaga";
import initGitForEditorSaga from "./initGitSaga";
import fetchGitMetadataSaga from "./fetchGitMetadataSaga";
import triggerAutocommitSaga from "./triggerAutcommitSaga";
import type { TakeableChannel } from "redux-saga";
import { objectKeys } from "@appsmith/utils";
import type { PayloadAction } from "@reduxjs/toolkit";

const gitRequestBlockingActions: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {
  // init
  [gitArtifactActions.fetchGitMetadataInit.type]: fetchGitMetadataSaga,

  // connect
  [gitArtifactActions.connectInit.type]: connectSaga,

  // ops
  [gitArtifactActions.commitInit.type]: commitSaga,

  // branches
  [gitArtifactActions.fetchBranchesInit.type]: fetchBranchesSaga,

  // settings
  [gitArtifactActions.fetchLocalProfileInit.type]: fetchLocalProfileSaga,
  [gitArtifactActions.updateLocalProfileInit.type]: updateLocalProfileSaga,
  [gitConfigActions.fetchGlobalProfileInit.type]: fetchGlobalProfileSaga,
  [gitConfigActions.updateGlobalProfileInit.type]: updateGlobalProfileSaga,

  // autocommit
  [gitArtifactActions.triggerAutocommitInit.type]: triggerAutocommitSaga,
};

const gitRequestNonBlockingActions: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {
  // init
  [gitArtifactActions.initGitForEditor.type]: initGitForEditorSaga,
};

/**
 * All git actions on the server are behind a lock,
 * that means that only one action can be performed at once.
 *
 * To follow the same principle, we will queue all actions from the client
 * as well and only perform one action at a time.
 *
 * This will ensure that client is not running parallel requests to the server for git
 * */
function* watchGitBlockingRequests() {
  const gitActionChannel: TakeableChannel<unknown> = yield actionChannel(
    objectKeys(gitRequestBlockingActions),
  );

  while (true) {
    const action: PayloadAction<unknown> = yield take(gitActionChannel);

    yield call(gitRequestBlockingActions[action.type], action);
  }
}

function* watchGitNonBlockingRequests() {
  const keys = objectKeys(gitRequestNonBlockingActions);

  for (const actionType of keys) {
    yield takeLatest(actionType, gitRequestNonBlockingActions[actionType]);
  }
}

export default function* gitSagas() {
  yield fork(watchGitNonBlockingRequests);
  yield fork(watchGitBlockingRequests);
}

// export function* gitSagas() {
//   yield all([
//     // init
//     takeLatest(gitArtifactActions.initGitForEditor.type, initGitForEditorSaga),
//     takeLatest(
//       gitArtifactActions.fetchGitMetadataInit.type,
//       fetchGitMetadataSaga,
//     ),

//     takeLatest(gitArtifactActions.connectInit.type, connectSaga),

//     // branches
//     takeLatest(gitArtifactActions.fetchBranchesInit.type, fetchBranchesSaga),

//     takeLatest(gitArtifactActions.commitInit.type, commitSaga),
//     takeLatest(
//       gitArtifactActions.fetchLocalProfileInit.type,
//       fetchLocalProfileSaga,
//     ),
//     takeLatest(
//       gitArtifactActions.updateLocalProfileInit.type,
//       updateLocalProfileSaga,
//     ),
//     takeLatest(
//       gitConfigActions.fetchGlobalProfileInit.type,
//       fetchGlobalProfileSaga,
//     ),
//     takeLatest(
//       gitConfigActions.updateGlobalProfileInit.type,
//       updateGlobalProfileSaga,
//     ),

//     // autocommit
//     takeLatest(
//       gitArtifactActions.triggerAutocommitInit.type,
//       triggerAutocommitSaga,
//     ),
//   ]);
// }
