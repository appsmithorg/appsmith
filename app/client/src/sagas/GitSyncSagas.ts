import {
  CurrentApplicationData,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithCallbacks,
} from "constants/ReduxActionConstants";
import { all, put, select, takeLatest, call } from "redux-saga/effects";

import GitSyncAPI from "api/GitSyncAPI";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
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
  updateBranchLocally,
  gitPullSuccess,
  fetchMergeStatusSuccess,
  fetchMergeStatusFailure,
  fetchGitStatusInit,
  setIsGitSyncModalOpen,
  setIsGitErrorPopupVisible,
} from "actions/gitSyncActions";
import {
  connectToGitSuccess,
  ConnectToGitReduxAction,
} from "../actions/gitSyncActions";
import { ApiResponse } from "api/ApiResponses";
import { GitConfig, GitSyncModalTab } from "entities/GitSync";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import { fetchGitStatusSuccess } from "actions/gitSyncActions";
import {
  createMessage,
  GIT_USER_UPDATED_SUCCESSFULLY,
} from "constants/messages";
import { GitApplicationMetadata } from "../api/ApplicationApi";

import history from "utils/history";
import { addBranchParam } from "constants/routes";
import { MergeBranchPayload, MergeStatusPayload } from "api/GitSyncAPI";

import {
  mergeBranchSuccess,
  // mergeBranchFailure,
} from "../actions/gitSyncActions";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { initEditor } from "actions/initActions";
import { fetchPage } from "actions/pageActions";

function* commitToGitRepoSaga(
  action: ReduxAction<{
    commitMessage: string;
    doPush: boolean;
  }>,
) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const gitMetaData: GitApplicationMetadata = yield select(
      getCurrentAppGitMetaData,
    );
    const response: ApiResponse = yield GitSyncAPI.commit({
      ...action.payload,
      branch: gitMetaData?.branchName || "",
      applicationId,
    });

    if (!response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR,
        payload: {
          error: response.responseMeta.error,
          show: false,
        },
      });
    }
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(commitToRepoSuccess());
      const curApplication: CurrentApplicationData = yield select(
        getCurrentApplication,
      );
      if (curApplication) {
        curApplication.lastDeployedAt = new Date().toISOString();
        yield put({
          type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
          payload: curApplication,
        });
      }
      yield put(fetchGitStatusInit());
    }
  } catch (error) {
    // yield put({
    //   type: ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR,
    //   payload: { error, logToSentry: true },
    // });
  }
}

function* connectToGitSaga(action: ConnectToGitReduxAction) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const currentPageId: string = yield select(getCurrentPageId);
    const response: ApiResponse = yield GitSyncAPI.connect(
      action.payload,
      applicationId,
    );
    if (!response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR,
        payload: {
          error: response.responseMeta.error,
          show: false,
        },
      });
    }
    const isValidResponse: boolean = yield validateResponse(response, false);

    if (isValidResponse) {
      yield put(connectToGitSuccess(response.data));
      yield put(fetchPage(currentPageId));
      if (action.onSuccessCallback) {
        action.onSuccessCallback(response.data);
      }
      const branch = response?.data?.gitApplicationMetadata?.branchName;

      const updatedPath = addBranchParam(branch);
      history.replace(updatedPath);
    }
  } catch (error) {
    if (action.onErrorCallback) {
      action.onErrorCallback(error as string);
    }
    // yield put({
    //   type: ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR,
    //   payload: { gitError: error, logToSentry: true },
    // });
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
    const branch = action.payload;
    yield put(updateBranchLocally(branch));
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.checkoutBranch(
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const updatedPath = addBranchParam(branch);
      history.push(updatedPath);
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.CHECKOUT_BRANCH_ERROR,
      payload: { error: e, logToSentry: true },
    });
  }
}

function* fetchBranches(action: ReduxAction<{ pruneBranches: boolean }>) {
  try {
    const pruneBranches = action.payload?.pruneBranches;
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.fetchBranches(
      applicationId,
      pruneBranches,
    );
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
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield GitSyncAPI.createNewBranch(
      applicationId,
      payload,
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
      branch: gitMetaData?.branchName || "",
    });
    if (!response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.PUSH_TO_GIT_ERROR,
        payload: {
          error: response.responseMeta.error,
          show: false,
        },
      });
    }
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(pushToRepoSuccess());
      yield put(fetchGitStatusInit());
    }
  } catch (error) {
    // yield put({
    //   type: ReduxActionErrorTypes.PUSH_TO_GIT_ERROR,
    //   payload: { error, logToSentry: true },
    // });
  }
}

function* fetchGitStatusSaga() {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const gitMetaData = yield select(getCurrentAppGitMetaData);
    const response: ApiResponse = yield GitSyncAPI.getGitStatus({
      applicationId,
      branch: gitMetaData?.branchName || "",
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

function* mergeBranchSaga(action: ReduxAction<MergeBranchPayload>) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);

    const { destinationBranch, sourceBranch } = action.payload;

    const response: ApiResponse = yield GitSyncAPI.merge({
      applicationId,
      sourceBranch,
      destinationBranch,
    });
    if (!response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.MERGE_BRANCH_ERROR,
        payload: {
          error: response.responseMeta.error,
          show: false,
        },
      });
    }
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put(mergeBranchSuccess());
      Toaster.show({
        text: "Merge Successful",
        variant: Variant.success,
      });
    }
  } catch (error) {
    // yield put(mergeBranchFailure());
  }
}

function* fetchMergeStatusSaga(action: ReduxAction<MergeStatusPayload>) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);

    const { destinationBranch, sourceBranch } = action.payload;
    const response: ApiResponse = yield GitSyncAPI.getMergeStatus({
      applicationId,
      sourceBranch,
      destinationBranch,
    });
    const isValidResponse: boolean = yield validateResponse(response, false);
    if (isValidResponse) {
      yield put(fetchMergeStatusSuccess(response.data));
    }
  } catch (error) {
    yield put(fetchMergeStatusFailure({ error, show: false }));
  }
}

function* gitPullSaga(
  action: ReduxAction<{ triggeredFromBottomBar: boolean }>,
) {
  const { triggeredFromBottomBar } = action.payload || {};
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response = yield call(GitSyncAPI.pull, { applicationId });
    if (!response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.GIT_PULL_ERROR,
        payload: {
          error: response.responseMeta.error,
          show: false,
        },
      });
    }
    const isValidResponse: boolean = yield validateResponse(response, false);
    const currentBranch = yield select(getCurrentGitBranch);
    const currentPageId = yield select(getCurrentPageId);
    if (isValidResponse) {
      const { mergeStatus } = response.data;
      yield put(gitPullSuccess(mergeStatus));
      yield put(initEditor(applicationId, currentPageId, currentBranch));
    }
  } catch (e) {
    // todo check based on error type
    if (triggeredFromBottomBar) {
      yield put(setIsGitErrorPopupVisible({ isVisible: true }));
    } else {
      yield put(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.DEPLOY,
        }),
      );
    }
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
    takeLatest(ReduxActionTypes.MERGE_BRANCH_INIT, mergeBranchSaga),
    takeLatest(ReduxActionTypes.FETCH_MERGE_STATUS_INIT, fetchMergeStatusSaga),
    takeLatest(ReduxActionTypes.GIT_PULL_INIT, gitPullSaga),
  ]);
}
