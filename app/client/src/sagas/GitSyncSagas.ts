import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, select, takeLatest } from "redux-saga/effects";

import GitSyncAPI from "api/GitSyncAPI";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import {
  commitToRepoSuccess,
  fetchGlobalGitConfigSuccess,
  updateGlobalGitConfigSuccess,
  pushToRepoSuccess,
  fetchLocalGitConfigSuccess,
  updateLocalGitConfigSuccess,
  fetchLocalGitConfigInit,
} from "actions/gitSyncActions";
import {
  connectToGitSuccess,
  ConnectToGitReduxAction,
} from "../actions/gitSyncActions";
import { ApiResponse } from "api/ApiResponses";
import { GitConfig } from "entities/GitSync";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  createMessage,
  GIT_USER_UPDATED_SUCCESSFULLY,
} from "constants/messages";

function* commitToGitRepoSaga(
  action: ReduxAction<{ commitMessage: string; doPush: boolean }>,
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
      Toaster.show({
        text: action.payload.doPush
          ? "Commited and pushed Successfully"
          : "Commited Successfully",
        variant: Variant.success,
      });
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
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.connect(
      action.payload,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(connectToGitSuccess(response.data));
      if (action.onSuccessCallback) {
        action.onSuccessCallback(response.data);
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

function* fetchGlobalGitConfig() {
  try {
    const response: ApiResponse = yield GitSyncAPI.getGlobalConfig();
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (isValidResponse) {
      yield put(fetchGlobalGitConfigSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_GLOBAL_GIT_CONFIG_ERROR,
      payload: { error, logToSentry: true, show: false },
    });
  }
}

function* updateGlobalGitConfig(action: ReduxAction<GitConfig>) {
  try {
    const response: ApiResponse = yield GitSyncAPI.setGlobalConfig(
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(updateGlobalGitConfigSuccess(response.data));
      Toaster.show({
        text: createMessage(GIT_USER_UPDATED_SUCCESSFULLY),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_GLOBAL_GIT_CONFIG_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* fetchLocalGitConfig() {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.getLocalConfig(
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (isValidResponse) {
      yield put(fetchLocalGitConfigSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_LOCAL_GIT_CONFIG_ERROR,
      payload: { error, logToSentry: true, show: false },
    });
  }
}

function* updateLocalGitConfig(action: ReduxAction<GitConfig>) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.setLocalConfig(
      action.payload,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(updateLocalGitConfigSuccess(response.data));
      yield put(fetchLocalGitConfigInit());
      Toaster.show({
        text: createMessage(GIT_USER_UPDATED_SUCCESSFULLY),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_LOCAL_GIT_CONFIG_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* pushToGitRepoSaga() {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.push({
      applicationId,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(pushToRepoSuccess());
      Toaster.show({
        text: "Pushed Successfully",
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUSH_TO_GIT_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

export default function* gitSyncSagas() {
  yield all([
    takeLatest(ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT, commitToGitRepoSaga),
    takeLatest(ReduxActionTypes.CONNECT_TO_GIT_INIT, connectToGitSaga),
    takeLatest(ReduxActionTypes.PUSH_TO_GIT_INIT, pushToGitRepoSaga),
    takeLatest(
      ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT,
      fetchGlobalGitConfig,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT,
      updateGlobalGitConfig,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_INIT,
      fetchLocalGitConfig,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_INIT,
      updateLocalGitConfig,
    ),
  ]);
}
