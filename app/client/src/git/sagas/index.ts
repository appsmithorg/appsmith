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
import triggerAutocommitSaga from "./triggerAutocommitSaga";
import fetchStatusSaga from "./fetchStatusSaga";
import fetchProtectedBranchesSaga from "./fetchProtectedBranchesSaga";
import pullSaga from "./pullSaga";
import fetchMergeStatusSaga from "./fetchMergeStatusSaga";
import updateProtectedBranchesSaga from "./updateProtectedBranchesSaga";
import fetchMetadataSaga from "./fetchMetadataSaga";
import toggleAutocommitSaga from "./toggleAutocommitSaga";
import disconnectSaga from "./disconnectSaga";

import {
  blockingActionSagas as blockingActionSagasExtended,
  nonBlockingActionSagas as nonBlockingActionSagasExtended,
} from "git/ee/sagas";

const blockingActionSagas: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {
  // init
  [gitArtifactActions.fetchMetadataInit.type]: fetchMetadataSaga,

  // connect
  [gitArtifactActions.connectInit.type]: connectSaga,
  [gitArtifactActions.disconnectInit.type]: disconnectSaga,

  // ops
  [gitArtifactActions.commitInit.type]: commitSaga,
  [gitArtifactActions.fetchStatusInit.type]: fetchStatusSaga,
  [gitArtifactActions.pullInit.type]: pullSaga,
  [gitArtifactActions.fetchMergeStatusInit.type]: fetchMergeStatusSaga,

  // branches
  [gitArtifactActions.fetchBranchesInit.type]: fetchBranchesSaga,

  // user profiles
  [gitArtifactActions.fetchLocalProfileInit.type]: fetchLocalProfileSaga,
  [gitArtifactActions.updateLocalProfileInit.type]: updateLocalProfileSaga,
  [gitConfigActions.fetchGlobalProfileInit.type]: fetchGlobalProfileSaga,
  [gitConfigActions.updateGlobalProfileInit.type]: updateGlobalProfileSaga,

  // protected branches
  [gitArtifactActions.fetchProtectedBranchesInit.type]:
    fetchProtectedBranchesSaga,
  [gitArtifactActions.updateProtectedBranchesInit.type]:
    updateProtectedBranchesSaga,

  // autocommit
  [gitArtifactActions.triggerAutocommitInit.type]: triggerAutocommitSaga,

  // EE
  ...blockingActionSagasExtended,
};

const nonBlockingActionSagas: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {
  // init
  [gitArtifactActions.initGitForEditor.type]: initGitForEditorSaga,
  [gitArtifactActions.toggleAutocommitInit.type]: toggleAutocommitSaga,

  // EE
  ...nonBlockingActionSagasExtended,
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
    objectKeys(blockingActionSagas),
  );

  while (true) {
    const action: PayloadAction<unknown> = yield take(gitActionChannel);

    yield call(blockingActionSagas[action.type], action);
  }
}

function* watchGitNonBlockingRequests() {
  const keys = objectKeys(nonBlockingActionSagas);

  for (const actionType of keys) {
    yield takeLatest(actionType, nonBlockingActionSagas[actionType]);
  }
}

export default function* gitSagas() {
  yield fork(watchGitNonBlockingRequests);
  yield fork(watchGitBlockingRequests);
}
