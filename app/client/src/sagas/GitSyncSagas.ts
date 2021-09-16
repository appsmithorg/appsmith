import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, select, takeLatest } from "redux-saga/effects";

import GitSyncAPI from "api/GitSyncAPI";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import { commitToRepoSuccess } from "actions/gitSyncActions";
import {
  connectToGitSuccess,
  ConnectToGitReduxAction,
} from "../actions/gitSyncActions";
import { ApiResponse } from "api/ApiResponses";

function* commitToGitRepoSaga(
  action: ReduxAction<{ commitMessage: string; pushImmediately: boolean }>,
) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.commit({
      ...action.payload,
      applicationId,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(commitToRepoSuccess());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* connectToGitSaga(action: ConnectToGitReduxAction) {
  try {
    const response: ApiResponse = yield GitSyncAPI.connect(action.payload);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(connectToGitSuccess(response.data));
      if (action.onSuccessCallback) {
        action.onSuccessCallback(response);
      }
    }
  } catch (error) {
    if (action.onErrorCallback) {
      action.onErrorCallback(error);
    }
    yield put({
      type: ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

export default function* gitSyncSagas() {
  yield all([
    takeLatest(ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT, commitToGitRepoSaga),
    takeLatest(ReduxActionTypes.CONNECT_TO_GIT_INIT, connectToGitSaga),
  ]);
}
