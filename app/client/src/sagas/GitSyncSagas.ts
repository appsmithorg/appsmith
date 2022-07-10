import {
  ApplicationPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithCallbacks,
} from "@appsmith/constants/ReduxActionConstants";
import {
  all,
  call,
  put,
  select,
  takeLatest,
  throttle,
} from "redux-saga/effects";
import GitSyncAPI, {
  MergeBranchPayload,
  MergeStatusPayload,
} from "api/GitSyncAPI";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import {
  commitToRepoSuccess,
  ConnectToGitReduxAction,
  connectToGitSuccess,
  deleteBranchError,
  deleteBranchSuccess,
  deletingBranch,
  discardChangesFailure,
  discardChangesSuccess,
  fetchBranchesInit,
  fetchBranchesSuccess,
  fetchGitStatusInit,
  fetchGitStatusSuccess,
  fetchGlobalGitConfigInit,
  fetchGlobalGitConfigSuccess,
  fetchLocalGitConfigInit,
  fetchLocalGitConfigSuccess,
  fetchMergeStatusFailure,
  fetchMergeStatusSuccess,
  GenerateSSHKeyPairReduxAction,
  GenerateSSHKeyPairResponsePayload,
  generateSSHKeyPairSuccess,
  getSSHKeyPairError,
  GetSSHKeyPairReduxAction,
  getSSHKeyPairSuccess,
  GetSSHKeyResponseData,
  gitPullSuccess,
  importAppViaGitSuccess,
  mergeBranchSuccess,
  setIsDisconnectGitModalOpen,
  setIsGitErrorPopupVisible,
  setIsGitSyncModalOpen,
  setShowRepoLimitErrorModal,
  switchGitBranchInit,
  updateLocalGitConfigSuccess,
} from "actions/gitSyncActions";

import { showReconnectDatasourceModal } from "actions/applicationActions";

import { ApiResponse } from "api/ApiResponses";
import { GitConfig, GitSyncModalTab } from "entities/GitSync";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
  getWorkspaceIdForImport,
} from "selectors/applicationSelectors";
import {
  createMessage,
  DELETE_BRANCH_SUCCESS,
  ERROR_GIT_AUTH_FAIL,
  ERROR_GIT_INVALID_REMOTE,
  GIT_USER_UPDATED_SUCCESSFULLY,
} from "@appsmith/constants/messages";
import { GitApplicationMetadata } from "api/ApplicationApi";

import history from "utils/history";
import { addBranchParam, GIT_BRANCH_QUERY_KEY } from "constants/routes";
import {
  getCurrentGitBranch,
  getDisconnectingGitApplication,
} from "selectors/gitSyncSelectors";
import { initEditor } from "actions/initActions";
import { fetchPage } from "actions/pageActions";
import { getLogToSentryFromResponse } from "utils/helpers";
import { getCurrentWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { Workspace } from "constants/workspaceConstants";
import { log } from "loglevel";
import GIT_ERROR_CODES from "constants/GitErrorCodes";
import { builderURL } from "RouteBuilder";
import { APP_MODE } from "../entities/App";

export function* handleRepoLimitReachedError(response?: ApiResponse) {
  const { responseMeta } = response || {};
  if (
    responseMeta?.error?.code ===
    GIT_ERROR_CODES.PRIVATE_REPO_CONNECTIONS_LIMIT_REACHED
  ) {
    yield put(setIsGitSyncModalOpen({ isOpen: false }));
    yield put(setShowRepoLimitErrorModal(true));
    return true;
  }
  return false;
}

function* commitToGitRepoSaga(
  action: ReduxAction<{
    commitMessage: string;
    doPush: boolean;
  }>,
) {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const gitMetaData: GitApplicationMetadata = yield select(
      getCurrentAppGitMetaData,
    );
    response = yield GitSyncAPI.commit({
      ...action.payload,
      branch: gitMetaData?.branchName || "",
      applicationId,
    });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(commitToRepoSuccess());
      const curApplication: ApplicationPayload = yield select(
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
    const isRepoLimitReachedError: boolean = yield call(
      handleRepoLimitReachedError,
      response,
    );
    if (isRepoLimitReachedError) return;

    if (response && !response.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR,
        payload: {
          error: response?.responseMeta?.error,
          show: false,
        },
      });
    } else {
      throw error;
    }
  }
}

function* connectToGitSaga(action: ConnectToGitReduxAction) {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const currentPageId: string = yield select(getCurrentPageId);
    response = yield GitSyncAPI.connect(action.payload, applicationId);

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(connectToGitSuccess(response?.data));
      yield put(fetchPage(currentPageId));
      if (action.onSuccessCallback) {
        // @ts-expect-error: response is of type unknown
        action.onSuccessCallback(response?.data);
      }
      // @ts-expect-error: response is of type unknown
      const branch = response?.data?.gitApplicationMetadata?.branchName;

      const updatedPath = addBranchParam(branch);
      history.replace(updatedPath);

      /* commit effect START */
      yield put(commitToRepoSuccess());
      const curApplication: ApplicationPayload = yield select(
        getCurrentApplication,
      );
      if (curApplication) {
        curApplication.lastDeployedAt = new Date().toISOString();
        yield put({
          type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
          payload: curApplication,
        });
      }
      /* commit effect END */
    }
  } catch (error) {
    if (action.onErrorCallback) {
      action.onErrorCallback(error as string);
    }

    const isRepoLimitReachedError: boolean = yield call(
      handleRepoLimitReachedError,
      response,
    );
    if (isRepoLimitReachedError) return;

    // Api error
    // Display on the UI
    if (response && !response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR,
        payload: {
          error: response?.responseMeta.error,
          show: false,
        },
      });
    } else {
      // Unexpected non api error: report to sentry
      throw error;
    }
  }
}

function* fetchGlobalGitConfig() {
  let response: ApiResponse | undefined;
  try {
    response = yield GitSyncAPI.getGlobalConfig();
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(fetchGlobalGitConfigSuccess(response?.data));
    }
  } catch (error) {
    // reset isFetching flag
    yield put({
      type: ReduxActionErrorTypes.FETCH_GLOBAL_GIT_CONFIG_ERROR,
      payload: {
        error,
        show: false,
      },
    });
    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* updateGlobalGitConfig(action: ReduxAction<GitConfig>) {
  let response: ApiResponse | undefined;
  try {
    response = yield GitSyncAPI.setGlobalConfig(action.payload);
    const isValidResponse: boolean = yield validateResponse(
      response,
      true,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(fetchGlobalGitConfigInit());
      Toaster.show({
        text: createMessage(GIT_USER_UPDATED_SUCCESSFULLY),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_GLOBAL_GIT_CONFIG_ERROR,
      payload: { error, show: false },
    });

    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

const trimRemotePrefix = (branch: string) => branch.replace(/^origin\//, "");

function* switchBranch(action: ReduxAction<string>) {
  let response: ApiResponse | undefined;
  try {
    const branch = action.payload;
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.checkoutBranch(applicationId, branch);
    const isValidResponse: boolean = yield validateResponse(
      response,
      true,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      const trimmedBranch = trimRemotePrefix(branch);
      const updatedPath = addBranchParam(trimmedBranch);
      history.push(updatedPath);
    }
  } catch (e) {
    // non api error
    if (!response || response?.responseMeta?.success) {
      throw e;
    }
  }
}

function* fetchBranches(action: ReduxAction<{ pruneBranches: boolean }>) {
  let response: ApiResponse | undefined;
  try {
    const pruneBranches = action.payload?.pruneBranches;
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.fetchBranches(applicationId, pruneBranches);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(fetchBranchesSuccess(response?.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_BRANCHES_ERROR,
      payload: { error, show: false },
    });
    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* fetchLocalGitConfig() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.getLocalConfig(applicationId);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(fetchLocalGitConfigSuccess(response?.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_LOCAL_GIT_CONFIG_ERROR,
      payload: { error, show: false },
    });
    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* createNewBranch(
  action: ReduxActionWithCallbacks<string, null, null>,
) {
  let response: ApiResponse | undefined;
  const { onErrorCallback, onSuccessCallback, payload } = action;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.createNewBranch(applicationId, payload);
    const isValidResponse: boolean = yield validateResponse(
      response,
      true,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(fetchBranchesInit());
      if (typeof onSuccessCallback === "function")
        yield call(onSuccessCallback, null);
      yield put(switchGitBranchInit(payload));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_NEW_BRANCH_ERROR,
      payload: { error, show: false },
    });
    if (typeof onErrorCallback === "function")
      yield call(onErrorCallback, null);

    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* updateLocalGitConfig(action: ReduxAction<GitConfig>) {
  let response: ApiResponse | undefined;

  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.setLocalConfig(action.payload, applicationId);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(updateLocalGitConfigSuccess(response?.data));
      yield put(fetchLocalGitConfigInit());
      Toaster.show({
        text: createMessage(GIT_USER_UPDATED_SUCCESSFULLY),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_LOCAL_GIT_CONFIG_ERROR,
      payload: { error, show: false },
    });
    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* fetchGitStatusSaga() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const gitMetaData: GitApplicationMetadata = yield select(
      getCurrentAppGitMetaData,
    );
    response = yield GitSyncAPI.getGitStatus({
      applicationId,
      branch: gitMetaData?.branchName || "",
    });
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(fetchGitStatusSuccess(response?.data));
    }
  } catch (error) {
    const payload = { error, show: true };
    if ((error as Error)?.message?.includes("Auth fail")) {
      payload.error = new Error(createMessage(ERROR_GIT_AUTH_FAIL));
    } else if ((error as Error)?.message?.includes("Invalid remote: origin")) {
      payload.error = new Error(createMessage(ERROR_GIT_INVALID_REMOTE));
    }

    yield put({
      type: ReduxActionErrorTypes.FETCH_GIT_STATUS_ERROR,
      payload,
    });

    // non api error
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* mergeBranchSaga(
  action: ReduxActionWithCallbacks<MergeBranchPayload, void, void>,
) {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);

    const { destinationBranch, sourceBranch } = action.payload;

    response = yield GitSyncAPI.merge({
      applicationId,
      sourceBranch,
      destinationBranch,
    });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(mergeBranchSuccess());
      if (action.onSuccessCallback) {
        action.onSuccessCallback();
      }
    }
  } catch (error) {
    // yield put(mergeBranchFailure());
    if (response && !response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.MERGE_BRANCH_ERROR,
        payload: {
          error: response?.responseMeta.error,
          show: false,
        },
      });
    } else {
      throw error;
    }
  }
}

function* fetchMergeStatusSaga(action: ReduxAction<MergeStatusPayload>) {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);

    const { destinationBranch, sourceBranch } = action.payload;
    response = yield GitSyncAPI.getMergeStatus({
      applicationId,
      sourceBranch,
      destinationBranch,
    });
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(fetchMergeStatusSuccess(response?.data));
    }
  } catch (error) {
    // @ts-expect-error: fetchMergeStatusFailure expects string
    yield put(fetchMergeStatusFailure({ error, show: false }));
    if (!response || response?.responseMeta?.success) {
      throw error;
    }
  }
}

function* gitPullSaga(
  action: ReduxAction<{ triggeredFromBottomBar: boolean }>,
) {
  let response: ApiResponse | undefined;
  const { triggeredFromBottomBar } = action.payload || {};
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield call(GitSyncAPI.pull, { applicationId });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    const currentBranch: string | undefined = yield select(getCurrentGitBranch);
    const currentPageId: string = yield select(getCurrentPageId);
    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      const { mergeStatus } = response?.data;
      yield put(gitPullSuccess(mergeStatus));
      yield put(
        initEditor({
          pageId: currentPageId,
          branch: currentBranch,
          mode: APP_MODE.EDIT,
        }),
      );
    }
  } catch (e) {
    // todo check based on error type
    if (triggeredFromBottomBar) {
      yield put(setIsGitErrorPopupVisible({ isVisible: true }));
    }

    if (response && !response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.GIT_PULL_ERROR,
        payload: {
          error: response?.responseMeta.error,
          show: false,
        },
      });
    } else {
      throw e;
    }
  }
}

function* showConnectGitModal() {
  // This is done through a separate saga in case we fetch
  // the flag to show to repo limit reached error modal in advance
  // currently it just opens the git sync modal assuming the APIs would
  // throw an error instead
  yield put(
    setIsGitSyncModalOpen({ isOpen: true, tab: GitSyncModalTab.DEPLOY }),
  );
}

function* disconnectGitSaga() {
  let response: ApiResponse | undefined;
  try {
    const application: {
      id: string;
      name: string;
    } = yield select(getDisconnectingGitApplication);
    const currentApplicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.disconnectGit({
      applicationId: application.id,
    });
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      const url = new URL(window.location.href);
      url.searchParams.delete(GIT_BRANCH_QUERY_KEY);
      history.push(url.toString().slice(url.origin.length));
      yield put({
        type: ReduxActionTypes.SET_DISCONNECTING_GIT_APPLICATION,
        payload: { id: "", name: "" },
      });
      yield put(setIsDisconnectGitModalOpen(false));
      yield put(
        setIsGitSyncModalOpen({
          isOpen: false,
        }),
      );

      // while disconnecting another application, i.e. not the current one
      if (currentApplicationId !== application.id) {
        yield put(
          setIsGitSyncModalOpen({
            isOpen: true,
            tab: GitSyncModalTab.GIT_CONNECTION,
          }),
        );
      }
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.DISCONNECT_TO_GIT_ERROR,
      payload: { error: e, show: false },
    });
    // non api error
    if (!response || response?.responseMeta?.success) {
      throw e;
    }
  }
}

function* importAppFromGitSaga(action: ConnectToGitReduxAction) {
  let response:
    | ApiResponse<{
        application: {
          id: string;
          pages: { default?: boolean; id: string; isDefault?: boolean }[];
        };
        isPartialImport: boolean;
      }>
    | undefined;
  try {
    const workspaceIdForImport: string = yield select(getWorkspaceIdForImport);

    response = yield GitSyncAPI.importApp(action.payload, workspaceIdForImport);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      const allWorkspaces: Workspace[] = yield select(getCurrentWorkspace);
      const currentWorkspace = allWorkspaces.filter(
        (el: Workspace) => el.id === workspaceIdForImport,
      );
      if (currentWorkspace.length > 0) {
        // @ts-expect-error: response can be undefined
        const { application: app, isPartialImport } = response?.data;
        yield put(importAppViaGitSuccess()); // reset flag for loader
        yield put(setIsGitSyncModalOpen({ isOpen: false }));
        // there is configuration-missing datasources
        if (isPartialImport) {
          yield put(
            showReconnectDatasourceModal({
              // @ts-expect-error: Type mismatch
              application: response?.data?.application,
              unConfiguredDatasourceList:
                // @ts-expect-error: Type mismatch
                response?.data.unConfiguredDatasourceList,
              workspaceId: workspaceIdForImport,
            }),
          );
        } else {
          let pageId = "";
          if (app.pages && app.pages.length > 0) {
            const defaultPage = app.pages.find(
              // @ts-expect-error: eachPage is any
              (eachPage) => !!eachPage.isDefault,
            );
            pageId = defaultPage ? defaultPage.id : "";
          }

          const pageURL = builderURL({
            applicationId: app.id,
            applicationSlug: app.slug,
            applicationVersion: app.applicationVersion,
            pageId,
          });
          history.push(pageURL);
          Toaster.show({
            text: "Application imported successfully",
            variant: Variant.success,
          });
        }
      }
    }
  } catch (error) {
    if (action.onErrorCallback) {
      action.onErrorCallback(error as string);
    }

    const isRepoLimitReachedError: boolean = yield call(
      handleRepoLimitReachedError,
      response,
    );
    if (isRepoLimitReachedError) return;

    // Api error
    // Display on the UI
    if (response && !response?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR,
        payload: {
          error: response?.responseMeta.error,
          show: false,
        },
      });
    } else {
      // Unexpected non api error: report to sentry
      log(error);
      throw error;
    }
  }
}

export function* getSSHKeyPairSaga(action: GetSSHKeyPairReduxAction) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const response: ApiResponse = yield call(
      GitSyncAPI.getSSHKeyPair,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response, false);
    if (isValidResponse) {
      // @ts-expect-error: response.data type mismatch
      yield put(getSSHKeyPairSuccess(response.data));
      if (action.onSuccessCallback) {
        // @ts-expect-error: response type mismatch
        action.onSuccessCallback(response);
      }
    }
  } catch (error) {
    // @ts-expect-error: getSSHKeyPairError expects string
    yield put(getSSHKeyPairError({ error, show: false }));
    if (action.onErrorCallback) {
      // @ts-expect-error: onErrorCallback expects string
      action.onErrorCallback(error);
    }
  }
}

export function* generateSSHKeyPairSaga(action: GenerateSSHKeyPairReduxAction) {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const isImporting: string = yield select(getWorkspaceIdForImport);

    response = yield call(
      GitSyncAPI.generateSSHKeyPair,
      applicationId,
      !!isImporting,
    );
    const isValidResponse: boolean = yield validateResponse(
      response,
      true,
      response?.responseMeta?.status === 500,
    );
    if (isValidResponse) {
      // @ts-expect-error: response.data type mismatch
      yield put(generateSSHKeyPairSuccess(response?.data));
      if (action.onSuccessCallback) {
        action.onSuccessCallback(
          response as GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
        );
      }
    }
  } catch (error) {
    if (action.onErrorCallback) {
      // @ts-expect-error: onErrorCallback expects string
      action.onErrorCallback(error);
    }
    yield call(handleRepoLimitReachedError, response);
  }
}

export function* deleteBranch({ payload }: ReduxAction<any>) {
  yield put(deletingBranch(payload));
  const { branchToDelete } = payload;
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);

    response = yield GitSyncAPI.deleteBranch(applicationId, branchToDelete);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(DELETE_BRANCH_SUCCESS, branchToDelete),
        variant: Variant.success,
      });
      yield put(deleteBranchSuccess(response?.data));
      yield put(fetchBranchesInit({ pruneBranches: true }));
    }
  } catch (error) {
    yield put(deleteBranchError(error));
  }
}

function* discardChanges() {
  let response: ApiResponse | undefined;
  try {
    const appId: string = yield select(getCurrentApplicationId);
    const doPull = true;
    response = yield GitSyncAPI.discardChanges(appId, doPull);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      yield put(discardChangesSuccess(response?.data));
      // yield fetchGitStatusSaga();
      const applicationId: string = yield select(getCurrentApplicationId);
      const pageId: string = yield select(getCurrentPageId);
      localStorage.setItem("GIT_DISCARD_CHANGES", "success");
      window.open(
        builderURL({ applicationId: applicationId, pageId: pageId }),
        "_self",
      );
    }
  } catch (error) {
    yield put(discardChangesFailure({ error }));
    localStorage.setItem("GIT_DISCARD_CHANGES", "failure");
  }
}

export default function* gitSyncSagas() {
  yield all([
    takeLatest(ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT, commitToGitRepoSaga),
    takeLatest(ReduxActionTypes.CONNECT_TO_GIT_INIT, connectToGitSaga),
    takeLatest(
      ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT,
      fetchGlobalGitConfig,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT,
      updateGlobalGitConfig,
    ),
    takeLatest(ReduxActionTypes.SWITCH_GIT_BRANCH_INIT, switchBranch),
    throttle(5 * 1000, ReduxActionTypes.FETCH_BRANCHES_INIT, fetchBranches),
    takeLatest(ReduxActionTypes.CREATE_NEW_BRANCH_INIT, createNewBranch),
    takeLatest(
      ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_INIT,
      fetchLocalGitConfig,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_INIT,
      updateLocalGitConfig,
    ),
    throttle(
      5 * 1000,
      ReduxActionTypes.FETCH_GIT_STATUS_INIT,
      fetchGitStatusSaga,
    ),
    takeLatest(ReduxActionTypes.MERGE_BRANCH_INIT, mergeBranchSaga),
    throttle(
      5 * 1000,
      ReduxActionTypes.FETCH_MERGE_STATUS_INIT,
      fetchMergeStatusSaga,
    ),
    takeLatest(ReduxActionTypes.GIT_PULL_INIT, gitPullSaga),
    takeLatest(ReduxActionTypes.SHOW_CONNECT_GIT_MODAL, showConnectGitModal),
    takeLatest(ReduxActionTypes.DISCONNECT_GIT, disconnectGitSaga),
    takeLatest(
      ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_INIT,
      importAppFromGitSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_SSH_KEY_PAIR_INIT,
      generateSSHKeyPairSaga,
    ),
    takeLatest(ReduxActionTypes.FETCH_SSH_KEY_PAIR_INIT, getSSHKeyPairSaga),
    takeLatest(ReduxActionTypes.DELETE_BRANCH_INIT, deleteBranch),
    takeLatest(ReduxActionTypes.GIT_DISCARD_CHANGES, discardChanges),
  ]);
}
