import {
  fetchAllPageEntityCompletion,
  setupPublishedPage,
} from "actions/pageActions";
import {
  executePageLoadActions,
  fetchActionsForView,
} from "actions/pluginActionActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { APP_MODE } from "entities/App";
import { call, put, spawn } from "redux-saga/effects";
import {
  failFastApiCalls,
  reportSWStatus,
  waitForWidgetConfigBuild,
} from "sagas/InitSagas";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import type { AppEnginePayload } from ".";
import AppEngine, { ActionsNotFoundError } from ".";
import { fetchJSLibraries } from "actions/JSLibraryActions";
import {
  waitForSegmentInit,
  waitForFetchUserSuccess,
} from "@appsmith/sagas/userSagas";
import { waitForFetchEnvironments } from "@appsmith/sagas/EnvironmentSagas";
import { fetchJSCollectionsForView } from "actions/jsActionActions";
import {
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
} from "actions/appThemingActions";

export default class AppViewerEngine extends AppEngine {
  constructor(mode: APP_MODE) {
    super(mode);
    this.setupEngine = this.setupEngine.bind(this);
    this.loadAppData = this.loadAppData.bind(this);
    this.loadAppURL = this.loadAppURL.bind(this);
    this.loadAppEntities = this.loadAppEntities.bind(this);
    this.loadGit = this.loadGit.bind(this);
    this.completeChore = this.completeChore.bind(this);
  }

  *loadGit() {
    return;
  }

  *completeChore() {
    yield call(waitForWidgetConfigBuild);
    yield put({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
    });
    if ("serviceWorker" in navigator) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      });
    }
    yield spawn(reportSWStatus);
  }

  *setupEngine(payload: AppEnginePayload) {
    yield call(super.setupEngine.bind(this), payload);
  }

  startPerformanceTracking() {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.INIT_VIEW_APP,
    );
  }

  stopPerformanceTracking() {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.INIT_VIEW_APP,
    );
  }

  *loadAppEntities(toLoadPageId: string, applicationId: string): any {
    const initActionsCalls: any = [
      fetchActionsForView({ applicationId }),
      fetchJSCollectionsForView({ applicationId }),
      fetchSelectedAppThemeAction(applicationId),
      fetchAppThemesAction(applicationId),
      setupPublishedPage(toLoadPageId, true, true),
    ];

    const successActionEffects = [
      ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
      ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
      ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      ReduxActionTypes.SETUP_PUBLISHED_PAGE_SUCCESS,
    ];
    const failureActionEffects = [
      ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
      ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
      ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
      ReduxActionErrorTypes.SETUP_PUBLISHED_PAGE_ERROR,
    ];

    initActionsCalls.push(fetchJSLibraries(applicationId));
    successActionEffects.push(ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS);
    failureActionEffects.push(ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED);

    const resultOfPrimaryCalls: boolean = yield failFastApiCalls(
      initActionsCalls,
      successActionEffects,
      failureActionEffects,
    );

    if (!resultOfPrimaryCalls)
      throw new ActionsNotFoundError(
        `Unable to fetch actions for the application: ${applicationId}`,
      );

    yield call(waitForFetchUserSuccess);
    yield call(waitForSegmentInit, true);
    yield call(waitForFetchEnvironments);
    yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));
  }
}
