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
import { ERROR_CODES } from "constants/ApiConstants";

import {
  fetchPage,
  fetchPageList,
  fetchPublishedPage,
  setAppMode,
  updateAppPersistentStore,
} from "actions/pageActions";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPluginFormConfigs, fetchPlugins } from "actions/pluginActions";
import { fetchActions, fetchActionsForView } from "actions/actionActions";
import { fetchApplication } from "actions/applicationActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { APP_MODE } from "reducers/entityReducers/appReducer";
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
import { initCommentThreads } from "actions/commentActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { executePageLoadActions } from "actions/widgetActions";

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
  const { applicationId, pageId } = initializeEditorAction.payload;
  try {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );
    yield put(setAppMode(APP_MODE.EDIT));
    yield put(updateAppPersistentStore(getPersistentAppStore(applicationId)));
    yield put({ type: ReduxActionTypes.START_EVALUATION });

    const applicationAndLayoutCalls = yield failFastApiCalls(
      [
        fetchPageList(applicationId, APP_MODE.EDIT),
        fetchPage(pageId),
        fetchApplication(applicationId, APP_MODE.EDIT),
      ],
      [
        ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
        ReduxActionTypes.FETCH_PAGE_SUCCESS,
        ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
        ReduxActionErrorTypes.FETCH_PAGE_ERROR,
        ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
      ],
    );
    if (!applicationAndLayoutCalls) return;

    const pluginsAndDatasourcesCalls = yield failFastApiCalls(
      [fetchPlugins(), fetchDatasources()],
      [
        ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
        ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
        ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      ],
    );
    if (!pluginsAndDatasourcesCalls) return;

    const pluginFormCall = yield failFastApiCalls(
      [fetchPluginFormConfigs()],
      [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
      [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
    );
    if (!pluginFormCall) return;

    const actionsCall = yield failFastApiCalls(
      [fetchActions(applicationId, [executePageLoadActions()])],
      [ReduxActionTypes.FETCH_ACTIONS_SUCCESS],
      [ReduxActionErrorTypes.FETCH_ACTIONS_ERROR],
    );

    if (!actionsCall) return;

    const currentApplication = yield select(getCurrentApplication);

    const appName = currentApplication ? currentApplication.name : "";
    const appId = currentApplication ? currentApplication.id : "";

    yield put(restoreRecentEntitiesRequest(applicationId));

    AnalyticsUtil.logEvent("EDITOR_OPEN", {
      appId: appId,
      appName: appName,
    });

    // todo remove (for dev)
    yield put(initCommentThreads());

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

  yield call(populatePageDSLsSaga);
}

export function* initializeAppViewerSaga(
  action: ReduxAction<{ applicationId: string; pageId: string }>,
) {
  const { applicationId, pageId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.INIT_VIEW_APP,
  );
  yield put(setAppMode(APP_MODE.PUBLISHED));
  yield put(updateAppPersistentStore(getPersistentAppStore(applicationId)));
  yield put({ type: ReduxActionTypes.START_EVALUATION });
  yield all([
    // TODO (hetu) Remove spl view call for fetch actions
    put(fetchActionsForView(applicationId)),
    put(fetchPageList(applicationId, APP_MODE.PUBLISHED)),
    put(fetchApplication(applicationId, APP_MODE.PUBLISHED)),
  ]);

  const resultOfPrimaryCalls = yield race({
    success: all([
      take(ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS),
      take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
      take(ReduxActionTypes.FETCH_APPLICATION_SUCCESS),
    ]),
    failure: take([
      ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
      ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
    ]),
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

    yield put(setAppMode(APP_MODE.PUBLISHED));

    // todo remove (for dev)
    yield put(initCommentThreads());

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
}

function* resetEditorSaga() {
  yield put(resetEditorSuccess());
  yield put(resetRecentEntities());
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
