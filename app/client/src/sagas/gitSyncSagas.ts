import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { all, call, debounce, put, takeLatest } from "redux-saga/effects";
import GitSyncApi from "api/GitSyncAPI";
import { ApiResponse } from "api/ApiResponses";
import { validateResponse } from "./ErrorSagas";
import {
  downloadPublicKeyError,
  downloadPublicKeySuccess,
  fetchGitStatusError,
  fetchGitStatusSuccess,
  fetchRepoDetailsError,
  fetchRepoDetailsSuccess,
  testRepoAuthenticationError,
  testRepoAuthenticationSuccess,
  updateRepoUrlError,
} from "actions/gitSyncActions";

import downloadjs from "downloadjs";

export function* fetchGitRepoDetails() {
  try {
    const response: ApiResponse = yield call(GitSyncApi.fetchRepoDetails);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchRepoDetailsSuccess(response.data));
    }
  } catch (error) {
    yield put(fetchRepoDetailsError(error));
  }
}

export function* updateRepoUrl(action: ReduxAction<string>) {
  try {
    const response: ApiResponse = yield call(
      GitSyncApi.updateRepo,
      action.payload,
    );
  } catch (error) {
    yield put(updateRepoUrlError(error));
  }
}

export function* downloadPublicKey() {
  try {
    const response: ApiResponse = yield call(GitSyncApi.fetchPublicKey);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      downloadjs(response.data, "key.txt", "text/plain");
      yield put(downloadPublicKeySuccess());
    }
  } catch (error) {
    yield put(downloadPublicKeyError(error));
  }
}

export function* testRepoAuthentication(
  action: ReduxAction<{ username: string; password: string } | undefined>,
) {
  try {
    yield call(GitSyncApi.testRepoAuthentication, action.payload);
    yield put(testRepoAuthenticationSuccess());
  } catch (error) {
    yield put(testRepoAuthenticationError(error));
  }
}

export function* fetchGitStatus() {
  try {
    const response: ApiResponse = yield call(GitSyncApi.fetchGitStatus);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchGitStatusSuccess(response.data));
    }
  } catch (error) {
    yield put(fetchGitStatusError(error));
  }
}

export default function* orgSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_GIT_REPO_DETAILS_INIT,
      fetchGitRepoDetails,
    ),
    debounce(1000, ReduxActionTypes.UPDATE_REPO_URL_INIT, updateRepoUrl),
    takeLatest(ReduxActionTypes.DOWNLOAD_PUBLIC_KEY_INIT, downloadPublicKey),
    takeLatest(ReduxActionTypes.TEST_REPO_AUTH_INIT, downloadPublicKey),
    takeLatest(ReduxActionTypes.FETCH_GIT_STATUS_INIT, fetchGitStatus),
  ]);
}
