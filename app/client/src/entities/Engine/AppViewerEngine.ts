import {
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
} from "actions/appThemingActions";
import { fetchJSCollectionsForView } from "actions/jsActionActions";
import {
  fetchAllPageEntityCompletion,
  fetchPublishedPage,
  fetchPublishedPageSuccess,
} from "actions/pageActions";
import {
  executePageLoadActions,
  fetchActionsForView,
} from "actions/pluginActionActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { call, put } from "redux-saga/effects";
import { failFastApiCalls } from "sagas/InitSagas";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AppEngine, { ActionsNotFoundError, AppEnginePayload } from ".";

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
    yield put({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
    });
    if ("serviceWorker" in navigator) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      });
    }
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
    const resultOfPrimaryCalls: boolean = yield failFastApiCalls(
      [
        fetchActionsForView({ applicationId }),
        fetchJSCollectionsForView({ applicationId }),
        fetchSelectedAppThemeAction(applicationId),
        fetchAppThemesAction(applicationId),
        fetchPublishedPage(toLoadPageId, true, true),
      ],
      [
        ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
        ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
        ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
        ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
        fetchPublishedPageSuccess().type,
      ],
      [
        ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
        ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
        ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
        ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
        ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR,
      ],
    );

    if (!resultOfPrimaryCalls)
      throw new ActionsNotFoundError(
        `Unable to fetch actions for the application: ${applicationId}`,
      );

    yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));
  }
}
