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
} from "ee/constants/ReduxActionConstants";
import type { APP_MODE } from "entities/App";
import { call, put, spawn } from "redux-saga/effects";
import type { DeployConsolidatedApi } from "sagas/InitSagas";
import {
  failFastApiCalls,
  reportSWStatus,
  waitForWidgetConfigBuild,
} from "sagas/InitSagas";
import type { AppEnginePayload } from ".";
import AppEngine, { ActionsNotFoundError } from ".";
import { fetchJSLibraries } from "actions/JSLibraryActions";
import {
  waitForSegmentInit,
  waitForFetchUserSuccess,
} from "ee/sagas/userSagas";
import { waitForFetchEnvironments } from "ee/sagas/EnvironmentSagas";
import { fetchJSCollectionsForView } from "actions/jsActionActions";
import {
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
} from "actions/appThemingActions";
import type { Span } from "@opentelemetry/api";
import { endSpan, startNestedSpan } from "UITelemetry/generateTraces";
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

  *completeChore(rootSpan: Span) {
    const completeChoreSpan = startNestedSpan(
      "AppViewerEngine.completeChore",
      rootSpan,
    );

    yield call(waitForWidgetConfigBuild);
    yield put({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
    });
    yield spawn(reportSWStatus);

    endSpan(completeChoreSpan);
  }

  *setupEngine(payload: AppEnginePayload, rootSpan: Span) {
    const viewerSetupSpan = startNestedSpan(
      "AppViewerEngine.setupEngine",
      rootSpan,
    );

    yield call(super.setupEngine.bind(this), payload, rootSpan);

    endSpan(viewerSetupSpan);
  }

  *loadAppEntities(
    toLoadPageId: string,
    applicationId: string,
    allResponses: DeployConsolidatedApi,
    rootSpan: Span,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const loadAppEntitiesSpan = startNestedSpan(
      "AppViewerEngine.loadAppEntities",
      rootSpan,
    );

    const {
      currentTheme,
      customJSLibraries,
      pageWithMigratedDsl,
      publishedActionCollections,
      publishedActions,
      themes,
    } = allResponses;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initActionsCalls: any = [
      fetchActionsForView({ applicationId, publishedActions }),
      fetchJSCollectionsForView({
        applicationId,
        publishedActionCollections,
      }),
      fetchSelectedAppThemeAction(applicationId, currentTheme),
      fetchAppThemesAction(applicationId, themes),
      setupPublishedPage(toLoadPageId, true, true, pageWithMigratedDsl),
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

    initActionsCalls.push(fetchJSLibraries(applicationId, customJSLibraries));
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

    const waitForUserSpan = startNestedSpan(
      "AppViewerEngine.waitForFetchUserSuccess",
      rootSpan,
    );

    yield call(waitForFetchUserSuccess);
    endSpan(waitForUserSpan);

    const waitForSegmentSpan = startNestedSpan(
      "AppViewerEngine.waitForSegmentInit",
      rootSpan,
    );

    yield call(waitForSegmentInit, true);
    endSpan(waitForSegmentSpan);

    const waitForEnvironmentsSpan = startNestedSpan(
      "AppViewerEngine.waitForFetchEnvironments",
      rootSpan,
    );

    yield call(waitForFetchEnvironments);
    endSpan(waitForEnvironmentsSpan);

    yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));

    endSpan(loadAppEntitiesSpan);
  }
}
