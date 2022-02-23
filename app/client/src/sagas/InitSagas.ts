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
  CurrentApplicationData,
  Page,
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
import { handleFetchedPage, populatePageDSLsSaga } from "./PageSagas";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import {
  resetRecentEntities,
  restoreRecentEntitiesRequest,
} from "actions/globalSearchActions";
import {
  InitializeEditorPayload,
  resetEditorSuccess,
} from "actions/initActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  getIsEditorInitialized,
  getPageById,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { getIsInitialized as getIsViewerInitialized } from "selectors/appViewSelectors";
import { fetchCommentThreadsInit } from "actions/commentActions";
import { fetchJSCollectionsForView } from "actions/jsActionActions";
import {
  addBranchParam,
  getApplicationEditorPageURL,
  getApplicationViewerPageURL,
} from "constants/routes";
import history from "utils/history";
import {
  fetchGitStatusInit,
  remoteUrlInputValue,
  resetPullMergeStatus,
  updateBranchLocally,
} from "actions/gitSyncActions";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import PageApi, { FetchPageResponse } from "api/PageApi";
import { isURLDeprecated, getUpdatedRoute } from "utils/helpers";

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

function* bootstrapEditor(payload: InitializeEditorPayload) {
  const { branch } = payload;
  yield put(resetEditorSuccess());
  yield put(updateBranchLocally(branch || ""));
  yield put(setAppMode(APP_MODE.EDIT));
  yield put({ type: ReduxActionTypes.START_EVALUATION });
}

function* initiateApplicationAndPages(payload: InitializeEditorPayload) {
  const pageId = payload.pageId;
  let applicationId = payload.applicationId;
  let fetchPageResponse;

  // Figure out applicationId if it is not present in the URL.
  // Delay fetch page effect to not disrupt the eval flow.
  if (!applicationId && pageId) {
    yield put(fetchPage(pageId as string, true, true));
    const raceResult: {
      success: { payload: FetchPageResponse };
      failure: any;
    } = yield race({
      success: take(ReduxActionTypes.FETCH_PAGE_HANDLE_LATER),
      failure: take(ReduxActionErrorTypes.FETCH_PAGE_ERROR),
    });

    if (raceResult.failure) return;

    const { payload } = raceResult.success;
    fetchPageResponse = payload;
    applicationId = fetchPageResponse.data.applicationId;
  }

  if (!applicationId) return;

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

  const applicationAndLayoutCalls: boolean = yield failFastApiCalls(
    initCalls,
    successEffects,
    failureEffects,
  );

  if (!applicationAndLayoutCalls) return;

  if (pageId && fetchPageResponse) {
    yield* handleFetchedPage({
      fetchPageResponse: fetchPageResponse,
      isFirstLoad: true,
      pageId,
    });
  }

  // This code is executed for all the old URLs.
  // * /applications/62133d17392872226a06a187/pages/62133d17392872226a06a187/edit
  // * /applications/62133d17392872226a06a187/edit
  // We will use defaultPageId if pageId is not in the URL.
  let toLoadPageId = pageId;
  if (!fetchPageResponse) {
    const defaultPageId: string = yield select(getDefaultPageId);
    toLoadPageId = toLoadPageId || defaultPageId;
    const fetchPageCallResult: boolean = yield failFastApiCalls(
      [fetchPage(toLoadPageId, true)],
      [ReduxActionTypes.FETCH_PAGE_SUCCESS],
      [ReduxActionErrorTypes.FETCH_PAGE_ERROR],
    );
    if (!fetchPageCallResult) return;
  }

  return { applicationId, pageId: toLoadPageId };
}

function* initiateEditorActions(applicationId: string, pageId: string) {
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
  const allActionCalls: boolean = yield failFastApiCalls(
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
}

function* initiatePluginsAndDatasources(applicationId: string, pageId: string) {
  const pluginsAndDatasourcesCalls: boolean = yield failFastApiCalls(
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

  const pluginFormCall: boolean = yield failFastApiCalls(
    [fetchPluginFormConfigs()],
    [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
    [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
  );
  if (!pluginFormCall) return;
}

function* initiateURLUpdate(pageId: string, pageIdInUrl?: string) {
  const currentApplication: CurrentApplicationData = yield select(
    getCurrentApplication,
  );
  const appName = currentApplication ? currentApplication.name : "";
  const appId = currentApplication ? currentApplication.id : "";
  const applicationSlug = currentApplication.slug as string;
  const currentPage: Page = yield select(getPageById(pageId));
  const pageSlug = currentPage?.slug as string;

  // Check if the the current route is a deprecated URL or if pageId is missing,
  // generate a new route with the v2 structure.
  let originalUrl = "";
  if (isURLDeprecated(window.location.pathname) || !pageIdInUrl) {
    originalUrl = getApplicationEditorPageURL(
      applicationSlug,
      pageSlug,
      pageId,
    );
  } else {
    // For urls which has pageId in it,
    // replace the placeholder values of application slug and page slug with real slug names.
    originalUrl = getUpdatedRoute(window.location.pathname, {
      applicationSlug,
      pageSlug,
      pageId,
    });
  }

  window.history.replaceState(null, "", originalUrl);

  AnalyticsUtil.logEvent("EDITOR_OPEN", {
    appId: appId,
    appName: appName,
  });
}

function* initiateGit(applicationId: string) {
  const branchInStore: string = yield select(getCurrentGitBranch);

  yield put(
    restoreRecentEntitiesRequest({
      applicationId,
      branch: branchInStore,
    }),
  );

  // init of temporay remote url from old application
  yield put(remoteUrlInputValue({ tempRemoteUrl: "" }));

  // add branch query to path and fetch status
  if (branchInStore) {
    history.replace(addBranchParam(branchInStore));
    yield put(fetchGitStatusInit());
  }

  yield put(resetPullMergeStatus());
}

function* initializeEditorSaga(
  initializeEditorAction: ReduxAction<InitializeEditorPayload>,
) {
  try {
    const { payload } = initializeEditorAction;

    const { branch } = payload;

    yield call(bootstrapEditor, payload);

    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );

    const { applicationId, pageId } = yield call(
      initiateApplicationAndPages,
      payload,
    );

    yield put(
      updateAppPersistentStore(getPersistentAppStore(applicationId, branch)),
    );

    yield call(initiateEditorActions, applicationId, pageId);

    yield call(initiatePluginsAndDatasources, applicationId, pageId);

    yield call(initiateURLUpdate, pageId, payload.pageId);

    yield call(initiateGit, applicationId);

    yield put(fetchCommentThreadsInit());

    yield put({
      type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    });

    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );

    yield call(populatePageDSLsSaga);
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
    branch: string;
    pageId: string;
    applicationId: string;
  }>,
) {
  const { branch, pageId } = action.payload;

  let { applicationId } = action.payload;

  if (!applicationId) {
    const currentPageInfo: FetchPageResponse = yield call(PageApi.fetchPage, {
      id: pageId,
    });
    applicationId = currentPageInfo.data.applicationId;
  }

  if (branch) yield put(updateBranchLocally(branch));

  if (!action.payload)
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

  const defaultPageId: string = yield select(getDefaultPageId);
  const toLoadPageId: string = pageId || defaultPageId;

  if (toLoadPageId) {
    yield put(fetchPublishedPage(toLoadPageId, true));

    const resultOfFetchPage: {
      success: boolean;
      failure: boolean;
    } = yield race({
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

  const { applicationSlug, pageSlug } = yield select(selectURLSlugs);

  let originalUrl = "";
  if (isURLDeprecated(window.location.pathname) || !pageId) {
    originalUrl = getApplicationViewerPageURL({
      applicationSlug,
      pageSlug,
      pageId: toLoadPageId,
    });
  } else {
    originalUrl = getUpdatedRoute(window.location.pathname, {
      applicationSlug,
      pageSlug,
      pageId: toLoadPageId,
    });
  }

  window.history.replaceState(null, "", originalUrl);

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
  const isEditorInitialised: boolean = yield select(getIsEditorInitialized);
  const isViewerInitialized: boolean = yield select(getIsViewerInitialized);
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
