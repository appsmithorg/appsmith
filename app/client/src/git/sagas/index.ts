import {
  actionChannel,
  call,
  fork,
  take,
  takeLatest,
} from "redux-saga/effects";
import type { TakeableChannel } from "redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";
import { objectKeys } from "@appsmith/utils";
import { gitConfigActions } from "../store/gitConfigSlice";
import { gitArtifactActions } from "../store/gitArtifactSlice";
import connectSaga from "./connectSaga";
import commitSaga from "./commitSaga";
import fetchGlobalProfileSaga from "./fetchGlobalProfileSaga";
import fetchBranchesSaga from "./fetchBranchesSaga";
import fetchLocalProfileSaga from "./fetchLocalProfileSaga";
import updateLocalProfileSaga from "./updateLocalProfileSaga";
import updateGlobalProfileSaga from "./updateGlobalProfileSaga";
import initGitForEditorSaga from "./initGitSaga";
import fetchGitMetadataSaga from "./fetchGitMetadataSaga";
import triggerAutocommitSaga from "./triggerAutocommitSaga";
import fetchStatusSaga from "./fetchStatusSaga";
import fetchProtectedBranchesSaga from "./fetchProtectedBranchesSaga";

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
  [gitArtifactActions.fetchStatusInit.type]: fetchStatusSaga,

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

  // settings
  [gitArtifactActions.fetchProtectedBranchesInit.type]:
    fetchProtectedBranchesSaga,
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
