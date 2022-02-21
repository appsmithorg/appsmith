import { get } from "lodash";
import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  InitializeEditorPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";

import {
  fetchPage,
  fetchPageList,
  fetchPublishedPage,
  setAppMode,
  updateAppPersistentStore,
} from "actions/pageActions";
import {
  fetchDatasources,
  fetchMockDatasources,
} from "actions/datasourceActions";
import { fetchPluginFormConfigs, fetchPlugins } from "actions/pluginActions";
import { fetchJSCollections } from "actions/jsActionActions";
import {
  executePageLoadActions,
  fetchActions,
  fetchActionsForView,
} from "actions/pluginActionActions";
import { fetchApplication } from "actions/applicationActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getPersistentAppStore } from "constants/AppConstants";
import { getDefaultPageId } from "./selectors";
import { populatePageDSLsSaga } from "./PageSagas";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import {
  resetRecentEntities,
  restoreRecentEntitiesRequest,
} from "actions/globalSearchActions";
import { resetEditorSuccess } from "actions/initActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import { getIsInitialized as getIsViewerInitialized } from "selectors/appViewSelectors";
import { fetchCommentThreadsInit } from "actions/commentActions";
import { fetchJSCollectionsForView } from "actions/jsActionActions";
import { addBranchParam, BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import {
  fetchGitStatusInit,
  remoteUrlInputValue,
  resetPullMergeStatus,
  updateBranchLocally,
} from "actions/gitSyncActions";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";

function* failFastApiCalls(
  triggerActions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
  successActions: string[],
  failureActions: string[],
) {
  const triggerEffects = [];
  for (const triggerAction of triggerActions) {
    triggerEffects.push(put(triggerAction));
  }
  const successEffects = [];
  for (const successAction of successActions) {
    successEffects.push(take(successAction));
  }
  yield all(triggerEffects);
  const effectRaceResult = yield race({
    success: all(successEffects),
    failure: take(failureActions),
  });
  if (effectRaceResult.failure) {
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: get(
          effectRaceResult,
          "failure.payload.error.code",
          ERROR_CODES.SERVER_ERROR,
        ),
      },
    });
    return false;
  }
  return true;
}

function* initializeEditorSaga(
  initializeEditorAction: ReduxAction<InitializeEditorPayload>,
) {
  yield put(resetEditorSuccess());
  const { applicationId, branch, pageId } = initializeEditorAction.payload;
  try {
    yield put(updateBranchLocally(branch || ""));

    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );
    yield put(setAppMode(APP_MODE.EDIT));
    yield put(
      updateAppPersistentStore(getPersistentAppStore(applicationId, branch)),
    );
    yield put({ type: ReduxActionTypes.START_EVALUATION });

    const initCalls = [
      fetchApplication({
        payload: {
          applicationId,
          mode: APP_MODE.EDIT,
        },
      }),
      fetchPageList({ applicationId }, APP_MODE.EDIT),
    ];
    const successEffects = [
      ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    ];

    const failureEffects = [
      ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
      ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
    ];
    if (pageId) {
      initCalls.push(fetchPage(pageId, true) as any);
      successEffects.push(ReduxActionTypes.FETCH_PAGE_SUCCESS);
      failureEffects.push(ReduxActionErrorTypes.FETCH_PAGE_ERROR);
    }

    const applicationAndLayoutCalls = yield failFastApiCalls(
      initCalls,
      successEffects,
      failureEffects,
    );

    if (!applicationAndLayoutCalls) return;

    const initActionsCalls = [
      fetchActions({ applicationId }, []),
      fetchJSCollections({ applicationId }),
    ];

    const successActionEffects = [
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
    ];
    const failureActionEffects = [
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
    ];
    const allActionCalls = yield failFastApiCalls(
      initActionsCalls,
      successActionEffects,
      failureActionEffects,
    );

    if (!allActionCalls) {
      return;
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_PLUGIN_AND_JS_ACTIONS_SUCCESS,
      });
      yield put(executePageLoadActions());
    }

    let fetchPageCallResult;
    const defaultPageId = yield select(getDefaultPageId);
    const toLoadPageId = pageId || defaultPageId;

    if (!pageId) {
      if (!toLoadPageId) return;

      fetchPageCallResult = yield failFastApiCalls(
        [fetchPage(toLoadPageId, true)],
        [ReduxActionTypes.FETCH_PAGE_SUCCESS],
        [ReduxActionErrorTypes.FETCH_PAGE_ERROR],
      );
      if (!fetchPageCallResult) return;
    }

    const pluginsAndDatasourcesCalls = yield failFastApiCalls(
      [fetchPlugins(), fetchDatasources(), fetchMockDatasources()],
      [
        ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
        ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
        ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
        ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
        ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR,
      ],
    );
    if (!pluginsAndDatasourcesCalls) return;

    const pluginFormCall = yield failFastApiCalls(
      [fetchPluginFormConfigs()],
      [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
      [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
    );
    if (!pluginFormCall) return;

    const currentApplication = yield select(getCurrentApplication);
    const appName = currentApplication ? currentApplication.name : "";
    const appId = currentApplication ? currentApplication.id : "";
    const branchInStore = yield select(getCurrentGitBranch);

    yield put(
      restoreRecentEntitiesRequest({
        applicationId: appId,
        branch: branchInStore,
      }),
    );

    yield put(fetchCommentThreadsInit());

    AnalyticsUtil.logEvent("EDITOR_OPEN", {
      appId: appId,
      appName: appName,
    });

    // init of temporay remote url from old application
    yield put(remoteUrlInputValue({ tempRemoteUrl: "" }));

    yield put({
      type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );

    yield call(populatePageDSLsSaga);

    // redirect to the /pages route
    if (!pageId) {
      const pathname = BUILDER_PAGE_URL({
        applicationId,
        pageId: toLoadPageId,
      });

      history.replace(pathname);
    }

    // add branch query to path and fetch status
    if (branchInStore) {
      history.replace(addBranchParam(branchInStore));
      yield put(fetchGitStatusInit());
    }

    yield put(resetPullMergeStatus());
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: ERROR_CODES.SERVER_ERROR,
      },
    });
    return;
  }
}

export function* initializeAppViewerSaga(
  action: ReduxAction<{
    applicationId: string;
    branch: string;
    pageId: string;
  }>,
) {
  const { applicationId, branch, pageId } = action.payload;

  if (branch) yield put(updateBranchLocally(branch));

  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.INIT_VIEW_APP,
  );
  yield put(setAppMode(APP_MODE.PUBLISHED));
  yield put(
    updateAppPersistentStore(getPersistentAppStore(applicationId, branch)),
  );
  yield put({ type: ReduxActionTypes.START_EVALUATION });
  const jsActionsCall = yield failFastApiCalls(
    [fetchJSCollectionsForView({ applicationId })],
    [ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS],
    [ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR],
  );
  if (!jsActionsCall) return;
  const initCalls = [
    // TODO (hetu) Remove spl view call for fetch actions
    put(fetchActionsForView({ applicationId })),
    put(fetchPageList({ applicationId }, APP_MODE.PUBLISHED)),
    put(
      fetchApplication({
        payload: {
          applicationId,
          mode: APP_MODE.PUBLISHED,
        },
      }),
    ),
  ];

  const initSuccessEffects = [
    take(ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_APPLICATION_SUCCESS),
  ];
  const initFailureEffects = [
    ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
    ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
    ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
  ];

  yield all(initCalls);

  const resultOfPrimaryCalls = yield race({
    success: all(initSuccessEffects),
    failure: take(initFailureEffects),
  });

  if (resultOfPrimaryCalls.failure) {
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: get(
          resultOfPrimaryCalls,
          "failure.payload.error.code",
          ERROR_CODES.SERVER_ERROR,
        ),
      },
    });
    return;
  }

  const defaultPageId = yield select(getDefaultPageId);
  const toLoadPageId = pageId || defaultPageId;

  if (toLoadPageId) {
    yield put(fetchPublishedPage(toLoadPageId, true));

    const resultOfFetchPage = yield race({
      success: take(ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS),
      failure: take(ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR),
    });

    if (resultOfFetchPage.failure) {
      yield put({
        type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
        payload: {
          code: get(
            resultOfFetchPage,
            "failure.payload.error.code",
            ERROR_CODES.SERVER_ERROR,
          ),
        },
      });
      return;
    }
  }

  yield put(setAppMode(APP_MODE.PUBLISHED));

  yield put(fetchCommentThreadsInit());

  yield put({
    type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
  });
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.INIT_VIEW_APP,
  );
  if ("serviceWorker" in navigator) {
    yield put({
      type: ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
    });
  }
}

function* resetEditorSaga() {
  yield put(resetEditorSuccess());
  yield put(resetRecentEntities());
}

export function* waitForInit() {
  const isEditorInitialised = yield select(getIsEditorInitialized);
  const isViewerInitialized = yield select(getIsViewerInitialized);
  if (!isEditorInitialised && !isViewerInitialized) {
    yield take([
      ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
    ]);
  }
}

export default function* watchInitSagas() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initializeEditorSaga),
    takeLatest(
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      initializeAppViewerSaga,
    ),
    takeLatest(ReduxActionTypes.RESET_EDITOR_REQUEST, resetEditorSaga),
  ]);
}
