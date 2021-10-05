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
  fetchLocalGitConfigSuccess,
  updateLocalGitConfigSuccess,
  fetchLocalGitConfigInit,
  switchGitBranchInit,
} from "actions/gitSyncActions";
import {
  connectToGitSuccess,
  ConnectToGitReduxAction,
} from "../actions/gitSyncActions";
import { ApiResponse } from "api/ApiResponses";
import { GitConfig } from "entities/GitSync";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { fetchGitStatusSuccess } from "actions/gitSyncActions";
import {
  createMessage,
  GIT_USER_UPDATED_SUCCESSFULLY,
} from "constants/messages";
import history from "utils/history";
import { getDefaultPathForBranch } from "constants/routes";
import { getDefaultApplicationId } from "selectors/applicationSelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import {
  fetchGitStatusInit,
  disconnectToGitSuccess,
} from "../actions/gitSyncActions";
import { GitApplicationMetadata } from "../api/ApplicationApi";
import { fetchApplication } from "../actions/applicationActions";
import { APP_MODE } from "entities/App";

function* commitToGitRepoSaga(
  action: ReduxAction<{
    commitMessage: string;
    doPush: boolean;
  }>,
) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const branch = yield select(getCurrentGitBranch);
    const response: ApiResponse = yield GitSyncAPI.commit({
      ...action.payload,
      applicationId,
      branch,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(commitToRepoSuccess());
      Toaster.show({
        text: action.payload.doPush
          ? "Committed and pushed Successfully"
          : "Committed Successfully",
        variant: Variant.success,
      });
      yield put(fetchGitStatusInit());
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
      const currentBranchName = yield select(getCurrentGitBranch);
      const branchName = response?.data?.gitApplicationMetadata?.branchName;

      if (currentBranchName !== branchName) {
        // TODO add page id here
        // stay at the current page while connecting for the first time
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

function* disconnectToGitSaga() {
  try {
    const defaultApplicationId = yield select(getDefaultApplicationId);
    const response: ApiResponse = yield GitSyncAPI.disconnect(
      defaultApplicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(disconnectToGitSuccess(response.data));
      yield put(
        fetchApplication({
          payload: { defaultApplicationId, mode: APP_MODE.EDIT },
        }),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DISCONNECT_TO_GIT_ERROR,
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

function* switchBranch(action: ReduxAction<string>) {
  try {
    const branchName = action.payload;
    const defaultApplicationId: string = yield select(getDefaultApplicationId);
    const response: ApiResponse = yield GitSyncAPI.checkoutBranch(
      defaultApplicationId,
      branchName,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const updatedPath = getDefaultPathForBranch({
        branchName,
        applicationId: defaultApplicationId,
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

function* createNewBranch(
  action: ReduxActionWithCallbacks<string, null, null>,
) {
  const { onErrorCallback, onSuccessCallback, payload } = action;
  try {
    const defaultApplicationId: string = yield select(getDefaultApplicationId);
    const parentBranch = yield select(getCurrentGitBranch);
    const response: ApiResponse = yield GitSyncAPI.createNewBranch(
      defaultApplicationId,
      payload,
      parentBranch,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(fetchBranchesInit());
      if (typeof onSuccessCallback === "function")
        yield call(onSuccessCallback, null);
      yield put(switchGitBranchInit(payload));
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
    const gitMetaData: GitApplicationMetadata = yield select(
      getCurrentAppGitMetaData,
    );
    const response: ApiResponse = yield GitSyncAPI.push({
      applicationId,
      branchName: gitMetaData?.branchName || "",
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(pushToRepoSuccess());
      Toaster.show({
        text: "Pushed Successfully",
        variant: Variant.success,
      });
      yield put(fetchGitStatusInit());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUSH_TO_GIT_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* fetchGitStatusSaga() {
  try {
    const gitMetaData = yield select(getCurrentAppGitMetaData);
    const response: ApiResponse = yield GitSyncAPI.getGitStatus({
      defaultApplicationId: gitMetaData.defaultApplicationId,
      branchName: gitMetaData?.branchName || "",
    });
    const isValidResponse: boolean = yield validateResponse(response, false);
    if (isValidResponse) {
      yield put(fetchGitStatusSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_GIT_STATUS_ERROR,
      payload: { error, logToSentry: true, show: false },
    });
  }
}

export default function* gitSyncSagas() {
  yield all([
    takeLatest(ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT, commitToGitRepoSaga),
    takeLatest(ReduxActionTypes.CONNECT_TO_GIT_INIT, connectToGitSaga),
    takeLatest(ReduxActionTypes.DISCONNECT_TO_GIT_INIT, disconnectToGitSaga),
    takeLatest(ReduxActionTypes.PUSH_TO_GIT_INIT, pushToGitRepoSaga),
    takeLatest(
      ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT,
      fetchGlobalGitConfig,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT,
      updateGlobalGitConfig,
    ),
    takeLatest(ReduxActionTypes.SWITCH_GIT_BRANCH_INIT, switchBranch),
    takeLatest(ReduxActionTypes.FETCH_BRANCHES_INIT, fetchBranches),
    takeLatest(ReduxActionTypes.CREATE_NEW_BRANCH_INIT, createNewBranch),
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
    takeLatest(ReduxActionTypes.FETCH_GIT_STATUS_INIT, fetchGitStatusSaga),
  ]);
}
