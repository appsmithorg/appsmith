import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithCallbacks,
} from "constants/ReduxActionConstants";
import { all, put, select, takeLatest, call } from "redux-saga/effects";

import GitSyncAPI from "api/GitSyncAPI";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import {
  commitToRepoSuccess,
  fetchBranchesInit,
  fetchBranchesSuccess,
  fetchGlobalGitConfigSuccess,
  updateGlobalGitConfigSuccess,
  pushToRepoSuccess,
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
import history from "utils/history";
import {
  extractBranchNameFromPath,
  getDefaultPathForBranch,
} from "constants/routes";

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
      const currentBranchName = extractBranchNameFromPath();
      const branchName = response?.data?.gitApplicationMetadata?.branchName;

      if (currentBranchName !== branchName) {
        const updatedPath = getDefaultPathForBranch({
          applicationId,
          branchName,
        });
        history.push(updatedPath);
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
    const isValidResponse: boolean = yield validateResponse(response);

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

function* switchBranch(action: ReduxAction<string>) {
  try {
    const branchName = action.payload;
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.checkoutBranch(
      applicationId,
      branchName,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const updatedPath = getDefaultPathForBranch({
        branchName,
        applicationId,
      });
      history.push(updatedPath);
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.CHECKOUT_BRANCH_ERROR,
      payload: { error: e, logToSentry: true },
    });
  }
}

function* fetchBranches() {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.fetchBranches(applicationId);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(fetchBranchesSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_BRANCHES_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* createNewBranch(
  action: ReduxActionWithCallbacks<string, null, null>,
) {
  const { onErrorCallback, onSuccessCallback, payload } = action;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const currentBranchName = extractBranchNameFromPath();
    const response: ApiResponse = yield GitSyncAPI.createNewBranch(
      applicationId,
      currentBranchName,
      payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(fetchBranchesInit());
      if (typeof onSuccessCallback === "function")
        yield call(onSuccessCallback, null);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_NEW_BRANCH_ERROR,
      payload: { error, logToSentry: true },
    });
    if (typeof onErrorCallback === "function")
      yield call(onErrorCallback, null);
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
    takeLatest(ReduxActionTypes.UPDATE_GIT_CONFIG_INIT, updateGlobalGitConfig),
    takeLatest(ReduxActionTypes.SWITCH_GIT_BRANCH_INIT, switchBranch),
    takeLatest(ReduxActionTypes.FETCH_BRANCHES_INIT, fetchBranches),
    takeLatest(ReduxActionTypes.CREATE_NEW_BRANCH_INIT, createNewBranch),
  ]);
}
