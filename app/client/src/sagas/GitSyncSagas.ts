import type {
  ApplicationPayload,
  ReduxAction,
  ReduxActionWithCallbacks,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  actionChannel,
  call,
  delay,
  fork,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import type { TakeableChannel } from "@redux-saga/core";
import type { MergeBranchPayload, MergeStatusPayload } from "api/GitSyncAPI";
import GitSyncAPI from "api/GitSyncAPI";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import type {
  ConnectToGitReduxAction,
  GenerateSSHKeyPairReduxAction,
  GenerateSSHKeyPairResponsePayload,
  GetSSHKeyPairReduxAction,
  GetSSHKeyResponseData,
  GitStatusParams,
} from "actions/gitSyncActions";
import {
  fetchGitRemoteStatusInit,
  fetchGitProtectedBranchesInit,
  updateGitProtectedBranchesInit,
  fetchGitRemoteStatusSuccess,
  clearCommitSuccessfulState,
} from "actions/gitSyncActions";
import {
  commitToRepoSuccess,
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
  generateSSHKeyPairSuccess,
  getSSHKeyPairError,
  getSSHKeyPairSuccess,
  gitPullSuccess,
  importAppViaGitStatusReset,
  importAppViaGitSuccess,
  mergeBranchSuccess,
  setIsDisconnectGitModalOpen,
  setIsGitErrorPopupVisible,
  setIsGitSyncModalOpen,
  setShowRepoLimitErrorModal,
  switchGitBranchInit,
  updateLocalGitConfigSuccess,
} from "actions/gitSyncActions";

import { showReconnectDatasourceModal } from "@appsmith/actions/applicationActions";

import type { ApiResponse } from "api/ApiResponses";
import type { GitConfig } from "entities/GitSync";
import { GitSyncModalTab } from "entities/GitSync";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
  getWorkspaceIdForImport,
} from "@appsmith/selectors/applicationSelectors";
import {
  createMessage,
  DELETE_BRANCH_SUCCESS,
  DISCARD_SUCCESS,
  ERROR_GIT_AUTH_FAIL,
  ERROR_GIT_INVALID_REMOTE,
  GIT_USER_UPDATED_SUCCESSFULLY,
  PROTECT_BRANCH_SUCCESS,
} from "@appsmith/constants/messages";
import type { GitApplicationMetadata } from "@appsmith/api/ApplicationApi";

import history from "utils/history";
import { addBranchParam, GIT_BRANCH_QUERY_KEY } from "constants/routes";
import {
  getCurrentGitBranch,
  getDisconnectingGitApplication,
  getIsGitConnectV2Enabled,
  getIsGitStatusLiteEnabled,
} from "selectors/gitSyncSelectors";
import { initEditor } from "actions/initActions";
import { fetchPage } from "actions/pageActions";
import { getLogToSentryFromResponse } from "utils/helpers";
import { getCurrentWorkspace } from "@appsmith/selectors/workspaceSelectors";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { log } from "loglevel";
import GIT_ERROR_CODES from "constants/GitErrorCodes";
import { builderURL } from "@appsmith/RouteBuilder";
import { APP_MODE } from "entities/App";
import type { GitDiscardResponse } from "reducers/uiReducers/gitSyncReducer";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import {
  getActions,
  getJSCollections,
} from "@appsmith/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import type { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { toast } from "design-system";
import { updateGitDefaultBranchSaga } from "@appsmith/sagas/GitExtendedSagas";

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
    const isGitStatusLiteEnabled: boolean = yield select(
      getIsGitStatusLiteEnabled,
    );
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
      if (isGitStatusLiteEnabled) {
        yield put(fetchGitRemoteStatusInit());
        yield put(fetchGitStatusInit({ compareRemote: false }));
      } else {
        yield put(fetchGitStatusInit({ compareRemote: true }));
      }
    } else {
      yield put({
        type: ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR,
        payload: {
          error: response?.responseMeta?.error,
          show: true,
        },
      });
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
          show: true,
        },
      });
      yield put({
        type: ReduxActionTypes.FETCH_GIT_STATUS_INIT,
      });
      // yield call(fetchGitStatusSaga);
    } else {
      throw error;
    }
  }
}

function* connectToGitSaga(action: ConnectToGitReduxAction) {
  let response:
    | ApiResponse<{ gitApplicationMetadata: { branchName: string } }>
    | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const currentPageId: string = yield select(getCurrentPageId);
    response = yield GitSyncAPI.connect(action.payload, applicationId);
    const isGitConnectV2Enabled: boolean = yield select(
      getIsGitConnectV2Enabled,
    );

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      // @ts-expect-error: response is of type unknown
      yield put(connectToGitSuccess(response?.data));
      const defaultBranch = response?.data?.gitApplicationMetadata?.branchName;

      if (isGitConnectV2Enabled) {
        yield put(
          updateGitProtectedBranchesInit({
            protectedBranches: defaultBranch ? [defaultBranch] : [],
          }),
        );
      }

      yield put(fetchPage(currentPageId));
      if (action.onSuccessCallback) {
        // @ts-expect-error: response is of type unknown
        action.onSuccessCallback(response?.data);
      }
      const branch = response?.data?.gitApplicationMetadata?.branchName;
      const updatedPath = addBranchParam(branch || "");
      history.replace(updatedPath);

      /* commit effect START */
      yield put(commitToRepoSuccess());
      yield put(clearCommitSuccessfulState());
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
  } catch (error: any) {
    if (action.onErrorCallback) {
      action.onErrorCallback(error as Error, response);
    }

    const isRepoLimitReachedError: boolean = yield call(
      handleRepoLimitReachedError,
      response,
    );
    if (isRepoLimitReachedError) return;

    // Api error
    // Display on the UI

    const errorResponse = response || error?.response?.data;

    if (errorResponse && !errorResponse?.responseMeta?.success) {
      yield put({
        type: ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR,
        payload: {
          error: errorResponse?.responseMeta.error,
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
      toast.show(createMessage(GIT_USER_UPDATED_SUCCESSFULLY), {
        kind: "success",
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
  let response: ApiResponse<ApplicationPayload> | undefined;
  try {
    const branch = action.payload;
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.checkoutBranch(applicationId, branch);
    const isValidResponse: boolean = yield validateResponse(
      response,
      true,
      getLogToSentryFromResponse(response),
    );

    if (!response || !isValidResponse) {
      return;
    }

    const trimmedBranch = trimRemotePrefix(branch);
    const destinationHref = addBranchParam(trimmedBranch);

    const entityInfo = identifyEntityFromPath(
      destinationHref.slice(0, destinationHref.indexOf("?")),
    );

    // Check if page exists in the branch. If not, instead of 404, take them to
    // the app home page
    const page = response.data.pages.find(
      (page) => page.id === entityInfo.pageId,
    );
    const homePage = response.data.pages.find((page) => page.isDefault);
    if (!page) {
      if (homePage) {
        history.push(
          builderURL({ pageId: homePage.id, branch: trimmedBranch }),
        );
        return;
      }
    }

    // Page exists, so we will try to go to the destination
    history.push(destinationHref);

    let shouldGoToHomePage = false;
    // It is possible that the action does not exist in the incoming branch
    // so here instead of showing the 404 page, we will navigate them to the
    // home page
    if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
      // Wait for fetch actions success, check if action id in actions state
      // or else navigate to home
      yield take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS);
      const actions: Action[] = yield select(getActions);
      if (!actions.find((action) => action.id === entityInfo.id)) {
        shouldGoToHomePage = true;
      }
    }

    // Same for JS Objects
    if (entityInfo.entity === FocusEntity.JS_OBJECT) {
      yield take(ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS);
      const jsActions: JSCollectionDataState = yield select(getJSCollections);
      if (!jsActions.find((action) => action.config.id === entityInfo.id)) {
        shouldGoToHomePage = true;
      }
    }

    if (shouldGoToHomePage) {
      if (homePage) {
        // We will replace so that the user does not go back to the 404 url
        history.replace(
          builderURL({ pageId: homePage.id, persistExistingParams: true }),
        );
      }
    }

    yield put({ type: ReduxActionTypes.SWITCH_GIT_BRANCH_SUCCESS });
  } catch (e) {
    // non api error
    yield put({ type: ReduxActionTypes.SWITCH_GIT_BRANCH_ERROR });
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
      toast.show(createMessage(GIT_USER_UPDATED_SUCCESSFULLY), {
        kind: "success",
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

function* fetchGitStatusSaga(action: ReduxAction<GitStatusParams>) {
  const isLiteEnabled: boolean = yield select(getIsGitStatusLiteEnabled);
  const shouldCompareRemote = isLiteEnabled
    ? !!action.payload?.compareRemote
    : true;

  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const gitMetaData: GitApplicationMetadata = yield select(
      getCurrentAppGitMetaData,
    );
    response = yield GitSyncAPI.getGitStatus({
      applicationId,
      branch: gitMetaData?.branchName || "",
      compareRemote: shouldCompareRemote ? "true" : "false",
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

interface FetchRemoteStatusSagaAction extends ReduxAction<undefined> {
  onSuccessCallback?: (data: any) => void;
  onErrorCallback?: (error: Error, response?: any) => void;
}

function* fetchGitRemoteStatusSaga(action: FetchRemoteStatusSagaAction) {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const gitMetaData: GitApplicationMetadata = yield select(
      getCurrentAppGitMetaData,
    );
    response = yield GitSyncAPI.getGitRemoteStatus({
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
      yield put(fetchGitRemoteStatusSuccess(response?.data));
    }
    if (typeof action?.onSuccessCallback === "function") {
      action.onSuccessCallback(response?.data);
    }
  } catch (error) {
    const payload = { error, show: !action?.onErrorCallback };
    if ((error as Error)?.message?.includes("Auth fail")) {
      payload.error = new Error(createMessage(ERROR_GIT_AUTH_FAIL));
    } else if ((error as Error)?.message?.includes("Invalid remote: origin")) {
      payload.error = new Error(createMessage(ERROR_GIT_INVALID_REMOTE));
    }

    yield put({
      type: ReduxActionErrorTypes.FETCH_GIT_REMOTE_STATUS_ERROR,
      payload,
    });

    if (typeof action?.onErrorCallback === "function") {
      action.onErrorCallback(error as Error, response);
    }

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
    setIsGitSyncModalOpen({
      isOpen: true,
      tab: GitSyncModalTab.DEPLOY,
      isDeploying: true,
    }),
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
    response = yield GitSyncAPI.revokeGit({
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
      yield put(importAppViaGitStatusReset());
      yield put(
        setIsGitSyncModalOpen({
          isOpen: false,
        }),
      );
      yield put({
        type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
      });

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
              unConfiguredDatasourceList: (response as any)?.data
                .unConfiguredDatasourceList,
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
          // TODO: Update URL Params
          const pageURL = builderURL({
            pageId,
          });
          history.push(pageURL);
          toast.show("Application imported successfully", {
            kind: "success",
          });
        }
      }
    }
  } catch (error) {
    if (action.onErrorCallback) {
      action.onErrorCallback(error as Error, response);
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
    const keyType = action.payload?.keyType || "ECDSA";

    response = yield call(
      GitSyncAPI.generateSSHKeyPair,
      applicationId,
      keyType,
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
      toast.show(createMessage(DELETE_BRANCH_SUCCESS, branchToDelete), {
        kind: "success",
      });
      yield put(deleteBranchSuccess(response?.data));
      yield put(fetchBranchesInit({ pruneBranches: true }));
    }
  } catch (error) {
    yield put(deleteBranchError({ error, show: true }));
  }
}

function* discardChanges({
  payload,
}: ReduxAction<{ successToastMessage: string } | null | undefined>) {
  let response: ApiResponse<GitDiscardResponse>;
  try {
    const appId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.discardChanges(appId);
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      yield put(discardChangesSuccess(response.data));
      const successToastMessage =
        payload?.successToastMessage ?? createMessage(DISCARD_SUCCESS);
      toast.show(successToastMessage, {
        kind: "success",
      });
      // adding delay to show toast animation before reloading
      yield delay(500);
      const pageId: string =
        response.data?.pages?.find((page: any) => page.isDefault)?.id || "";
      const branch = response.data.gitApplicationMetadata.branchName;
      window.open(builderURL({ pageId, branch }), "_self");
    } else {
      yield put(
        discardChangesFailure({
          error: response?.responseMeta?.error?.message,
          show: true,
        }),
      );
    }
  } catch (error) {
    yield put(discardChangesFailure({ error, show: true }));
  }
}

function* fetchGitProtectedBranchesSaga() {
  let response: ApiResponse<string[]>;
  try {
    const appId: string = yield select(getCurrentApplicationId);
    response = yield GitSyncAPI.getProtectedBranches(appId);

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      const protectedBranches: string[] = response?.data;
      yield put({
        type: ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_SUCCESS,
        payload: { protectedBranches },
      });
    } else {
      yield put({
        type: ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_ERROR,
        payload: {
          error: response?.responseMeta?.error?.message,
          show: true,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_ERROR,
      payload: { error, show: true },
    });
  }
}

function* updateGitProtectedBranchesSaga({
  payload,
}: ReduxAction<{ protectedBranches: string[] }>) {
  const { protectedBranches } = payload;
  const applicationId: string = yield select(getCurrentApplicationId);
  let response: ApiResponse<string[]>;
  try {
    response = yield call(
      GitSyncAPI.updateProtectedBranches,
      applicationId,
      protectedBranches,
    );
    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_SUCCESS,
      });
      yield put(fetchGitProtectedBranchesInit());
      toast.show(createMessage(PROTECT_BRANCH_SUCCESS), {
        kind: "success",
      });
    } else {
      yield put({
        type: ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_ERROR,
        payload: {
          error: response?.responseMeta?.error?.message,
          show: true,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_ERROR,
      payload: { error, show: true },
    });
  }
}

const gitRequestBlockingActions: Record<
  (typeof ReduxActionTypes)[keyof typeof ReduxActionTypes],
  (...args: any[]) => any
> = {
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT]: commitToGitRepoSaga,
  [ReduxActionTypes.CONNECT_TO_GIT_INIT]: connectToGitSaga,
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT]: updateGlobalGitConfig,
  [ReduxActionTypes.FETCH_BRANCHES_INIT]: fetchBranches,
  [ReduxActionTypes.SWITCH_GIT_BRANCH_INIT]: switchBranch,
  [ReduxActionTypes.CREATE_NEW_BRANCH_INIT]: createNewBranch,
  [ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_INIT]: updateLocalGitConfig,
  [ReduxActionTypes.MERGE_BRANCH_INIT]: mergeBranchSaga,
  [ReduxActionTypes.FETCH_MERGE_STATUS_INIT]: fetchMergeStatusSaga,
  [ReduxActionTypes.GIT_PULL_INIT]: gitPullSaga,
  [ReduxActionTypes.REVOKE_GIT]: disconnectGitSaga,
  [ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_INIT]: importAppFromGitSaga,
  [ReduxActionTypes.GENERATE_SSH_KEY_PAIR_INIT]: generateSSHKeyPairSaga,
  [ReduxActionTypes.DELETE_BRANCH_INIT]: deleteBranch,
  [ReduxActionTypes.GIT_DISCARD_CHANGES]: discardChanges,
  [ReduxActionTypes.GIT_UPDATE_DEFAULT_BRANCH_INIT]: updateGitDefaultBranchSaga,
  [ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_INIT]:
    updateGitProtectedBranchesSaga,
};

const gitRequestNonBlockingActions: Record<
  (typeof ReduxActionTypes)[keyof typeof ReduxActionTypes],
  (...args: any[]) => any
> = {
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT]: fetchGlobalGitConfig,
  [ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_INIT]: fetchLocalGitConfig,
  [ReduxActionTypes.FETCH_GIT_STATUS_INIT]: fetchGitStatusSaga,
  [ReduxActionTypes.FETCH_GIT_REMOTE_STATUS_INIT]: fetchGitRemoteStatusSaga,
  [ReduxActionTypes.SHOW_CONNECT_GIT_MODAL]: showConnectGitModal,
  [ReduxActionTypes.FETCH_SSH_KEY_PAIR_INIT]: getSSHKeyPairSaga,
  [ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_INIT]:
    fetchGitProtectedBranchesSaga,
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
    Object.keys(gitRequestBlockingActions),
  );

  while (true) {
    const { type, ...args }: ReduxAction<unknown> =
      yield take(gitActionChannel);
    yield call(gitRequestBlockingActions[type], { type, ...args });
  }
}

function* watchGitNonBlockingRequests() {
  const keys = Object.keys(gitRequestNonBlockingActions);
  for (const actionType of keys) {
    yield takeLatest(actionType, gitRequestNonBlockingActions[actionType]);
  }
}

export default function* gitSyncSagas() {
  yield fork(watchGitNonBlockingRequests);
  yield fork(watchGitBlockingRequests);
}
