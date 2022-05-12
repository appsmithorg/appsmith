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
  ApplicationPayload,
  Page,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "@appsmith/constants/ReduxActionConstants";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";

import {
  fetchPage,
  fetchPublishedPage,
  fetchPublishedPageSuccess,
  resetApplicationWidgets,
  resetPageList,
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
import {
  ApplicationVersion,
  fetchApplication,
  resetCurrentApplication,
} from "actions/applicationActions";
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
import {
  InitializeEditorPayload,
  resetEditorSuccess,
} from "actions/initActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  getPageById,
} from "selectors/editorSelectors";
import { getIsInitialized as getIsViewerInitialized } from "selectors/appViewSelectors";
import { fetchCommentThreadsInit } from "actions/commentActions";
import { fetchJSCollectionsForView } from "actions/jsActionActions";
import {
  addBranchParam,
  PLACEHOLDER_APP_SLUG,
  PLACEHOLDER_PAGE_SLUG,
} from "constants/routes";
import history from "utils/history";
import {
  fetchGitStatusInit,
  remoteUrlInputValue,
  resetPullMergeStatus,
  updateBranchLocally,
} from "actions/gitSyncActions";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { isURLDeprecated, getUpdatedRoute } from "utils/helpers";
import { fillPathname, viewerURL, builderURL } from "RouteBuilder";
import { enableGuidedTour } from "actions/onboardingActions";
import { setPreviewModeAction } from "actions/editorActions";
import {
  fetchSelectedAppThemeAction,
  fetchAppThemesAction,
} from "actions/appThemingActions";

export function* failFastApiCalls(
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

/**
 * this saga is called once then application is loaded.
 * It will hold the editor in uninitialized till all the apis/actions are completed
 *
 * @param initializeEditorAction
 * @returns
 */
function* bootstrapEditor(payload: InitializeEditorPayload) {
  const { branch } = payload;
  yield put(resetEditorSuccess());
  yield put(updateBranchLocally(branch || ""));
  yield put(setAppMode(APP_MODE.EDIT));
  yield put({ type: ReduxActionTypes.START_EVALUATION });
}

function* initiateURLUpdate(
  pageId: string,
  appMode: APP_MODE,
  pageIdInUrl?: string,
) {
  try {
    const currentApplication: ApplicationPayload = yield select(
      getCurrentApplication,
    );

    const applicationSlug = currentApplication.slug || PLACEHOLDER_APP_SLUG;
    const currentPage: Page = yield select(getPageById(pageId));
    const pageSlug = currentPage?.slug || PLACEHOLDER_PAGE_SLUG;
    let originalUrl = "";
    const { hash, pathname, search } = window.location;

    // For switching new URLs to old.
    if (currentApplication.applicationVersion < ApplicationVersion.SLUG_URL) {
      if (!isURLDeprecated(pathname)) {
        // We do not allow downgrading application version but,
        // when switch from a branch with updated URL to another one with legacy URLs,
        // we need to compute the legacy url
        // This scenario can happen only in edit mode.
        originalUrl =
          builderURL({
            applicationId: currentApplication.id,
            pageId: pageId,
          }) + hash;
        history.replace(originalUrl);
      }
    } else {
      // For updated apps,
      // Check if the the current route is a deprecated URL or if pageId is missing (bookmarked urls) and
      // generate a new route with the v2 structure.
      if (isURLDeprecated(pathname) || !pageIdInUrl) {
        if (appMode === APP_MODE.EDIT) {
          // If edit mode, replace /applications/appId/pages/pageId with /appSlug/pageSlug-pageId,
          // to not affect the rest of the url. eg. /api/apiId
          originalUrl =
            fillPathname(pathname, currentApplication, currentPage) +
            search +
            hash;
        } else {
          // View Mode - generate a new viewer URL - auto updates query params
          originalUrl = viewerURL({ applicationSlug, pageSlug, pageId }) + hash;
        }
      } else {
        // For urls which has pageId in it,
        // replace the placeholder values of application slug and page slug with real slug names.
        originalUrl =
          getUpdatedRoute(pathname, {
            applicationSlug,
            pageSlug,
            pageId,
          }) +
          search +
          hash;
      }
      history.replace(originalUrl);
    }
  } catch (e) {
    log.error(e);
  }
}

function* initiateEditorApplicationAndPages(payload: InitializeEditorPayload) {
  const pageId = payload.pageId;
  const applicationId = payload.applicationId;

  const applicationCall: boolean = yield failFastApiCalls(
    [fetchApplication({ pageId, applicationId, mode: APP_MODE.EDIT })],
    [
      ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
      ReduxActionErrorTypes.FETCH_PAGE_ERROR,
    ],
  );

  if (!applicationCall) return;

  let toLoadPageId = pageId;
  const defaultPageId: string = yield select(getDefaultPageId);
  toLoadPageId = toLoadPageId || defaultPageId;

  yield call(initiateURLUpdate, toLoadPageId, APP_MODE.EDIT, payload.pageId);

  const fetchPageCallResult: boolean = yield failFastApiCalls(
    [fetchPage(toLoadPageId, true)],
    [ReduxActionTypes.FETCH_PAGE_SUCCESS],
    [ReduxActionErrorTypes.FETCH_PAGE_ERROR],
  );

  if (!fetchPageCallResult) return;

  return toLoadPageId;
}

function* initiateEditorActions(applicationId: string) {
  const initActionsCalls = [
    fetchActions({ applicationId }, []),
    fetchJSCollections({ applicationId }),
    fetchSelectedAppThemeAction(applicationId),
    fetchAppThemesAction(applicationId),
  ];

  const successActionEffects = [
    ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
    ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
    ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
    ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
  ];
  const failureActionEffects = [
    ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
    ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
    ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
    ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
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

function* initiatePluginsAndDatasources() {
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

    yield call(initiateEditorApplicationAndPages, payload);

    const { id: applicationId, name }: ApplicationPayload = yield select(
      getCurrentApplication,
    );

    yield put(
      updateAppPersistentStore(getPersistentAppStore(applicationId, branch)),
    );

    yield all([
      call(initiateEditorActions, applicationId),
      call(initiatePluginsAndDatasources),
      call(populatePageDSLsSaga),
    ]);

    AnalyticsUtil.logEvent("EDITOR_OPEN", {
      appId: applicationId,
      appName: name,
    });

    yield call(initiateGit, applicationId);

    yield put(fetchCommentThreadsInit());

    yield put({
      type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    });

    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );
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

  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.INIT_VIEW_APP,
  );

  yield put(updateBranchLocally(branch || ""));

  yield put(setAppMode(APP_MODE.PUBLISHED));

  const applicationCall: boolean = yield failFastApiCalls(
    [fetchApplication({ applicationId, pageId, mode: APP_MODE.PUBLISHED })],
    [
      ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
      ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
    ],
  );

  if (!applicationCall) return;

  applicationId = applicationId || (yield select(getCurrentApplicationId));
  yield put(
    updateAppPersistentStore(getPersistentAppStore(applicationId, branch)),
  );
  yield put({ type: ReduxActionTypes.START_EVALUATION });

  const defaultPageId: string = yield select(getDefaultPageId);
  const toLoadPageId: string = pageId || defaultPageId;

  yield call(initiateURLUpdate, toLoadPageId, APP_MODE.PUBLISHED, pageId);

  const resultOfPrimaryCalls: boolean = yield failFastApiCalls(
    [
      fetchActionsForView({ applicationId }),
      fetchJSCollectionsForView({ applicationId }),
      fetchPublishedPage(toLoadPageId, true, true),
      fetchSelectedAppThemeAction(applicationId),
      fetchAppThemesAction(applicationId),
    ],
    [
      ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
      ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
      ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
    ],
    [
      ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
      ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
      ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
      ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR,
    ],
  );

  if (!resultOfPrimaryCalls) return;

  //Delay page load actions till all actions are retrieved.
  yield put(fetchPublishedPageSuccess([executePageLoadActions()]));

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
  yield put(resetCurrentApplication());
  yield put(resetPageList());
  yield put(resetApplicationWidgets());
  yield put(resetRecentEntities());
  // End guided tour once user exits editor
  yield put(enableGuidedTour(false));
  // Reset to edit mode once user exits editor
  // Without doing this if the user creates a new app they
  // might end up in preview mode if they were in preview mode
  // previously
  yield put(setPreviewModeAction(false));
  yield put(resetEditorSuccess());
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
