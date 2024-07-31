import { fetchApplication } from "@appsmith/actions/applicationActions";
import { setAppMode, updateAppStore } from "actions/pageActions";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getPersistentAppStore } from "constants/AppConstants";
import type { APP_MODE } from "entities/App";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import type { InitConsolidatedApi } from "sagas/InitSagas";
import { failFastApiCalls } from "sagas/InitSagas";
import { getDefaultPageId } from "sagas/selectors";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import history from "utils/history";
import type URLRedirect from "entities/URLRedirect/index";
import URLGeneratorFactory from "entities/URLRedirect/factory";
import { updateBranchLocally } from "actions/gitSyncActions";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { restoreIDEEditorViewMode } from "actions/ideActions";
import type { Span } from "@opentelemetry/api";
import { endSpan, startNestedSpan } from "UITelemetry/generateTraces";

export interface AppEnginePayload {
  applicationId?: string;
  pageId?: string;
  branch?: string;
  mode: APP_MODE;
  shouldInitialiseUserDetails?: boolean;
}

export interface IAppEngine {
  setupEngine(payload: AppEnginePayload, rootSpan: Span): any;
  loadAppData(payload: AppEnginePayload, rootSpan: Span): any;
  loadAppURL(pageId: string, pageIdInUrl?: string): any;
  loadAppEntities(
    toLoadPageId: string,
    applicationId: string,
    rootSpan: Span,
  ): any;
  loadGit(applicationId: string): any;
  completeChore(): any;
}

export class AppEngineApiError extends Error {}
export class PageNotFoundError extends AppEngineApiError {}
export class ActionsNotFoundError extends AppEngineApiError {}
export class PluginsNotFoundError extends AppEngineApiError {}
export class PluginFormConfigsNotFoundError extends AppEngineApiError {}

export default abstract class AppEngine {
  private _mode: APP_MODE;
  constructor(mode: APP_MODE) {
    this._mode = mode;
    this._urlRedirect = null;
  }
  private _urlRedirect: URLRedirect | null;

  abstract loadAppEntities(
    toLoadPageId: string,
    applicationId: string,
    allResponses: InitConsolidatedApi,
    rootSpan: Span,
  ): any;
  abstract loadGit(applicationId: string, rootSpan: Span): any;
  abstract startPerformanceTracking(): any;
  abstract stopPerformanceTracking(): any;
  abstract completeChore(rootSpan: Span): any;

  *loadAppData(
    payload: AppEnginePayload,
    allResponses: InitConsolidatedApi,
    rootSpan: Span,
  ) {
    const loadAppDataSpan = startNestedSpan("AppEngine.loadAppData", rootSpan);
    const { applicationId, branch, pageId } = payload;
    const { pages } = allResponses;
    const apiCalls: boolean = yield failFastApiCalls(
      [
        fetchApplication({
          applicationId,
          pageId,
          mode: this._mode,
          pages,
        }),
      ],
      [
        ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
        ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
        ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
      ],
    );

    if (!apiCalls) {
      throw new PageNotFoundError(`Cannot find page with id: ${pageId}`);
    }

    const application: ApplicationPayload = yield select(getCurrentApplication);
    const currentGitBranch: ReturnType<typeof getCurrentGitBranch> =
      yield select(getCurrentGitBranch);
    yield put(
      updateAppStore(
        getPersistentAppStore(application.id, branch || currentGitBranch),
      ),
    );
    const toLoadPageId: string = pageId || (yield select(getDefaultPageId));
    this._urlRedirect = URLGeneratorFactory.create(
      application.applicationVersion,
      this._mode,
    );

    endSpan(loadAppDataSpan);
    return { toLoadPageId, applicationId: application.id };
  }

  *setupEngine(payload: AppEnginePayload, rootSpan: Span): any {
    const setupEngineSpan = startNestedSpan("AppEngine.setupEngine", rootSpan);

    const { branch } = payload;
    yield put(updateBranchLocally(branch || ""));
    yield put(setAppMode(this._mode));
    yield put(restoreIDEEditorViewMode());
    yield put({ type: ReduxActionTypes.START_EVALUATION });

    endSpan(setupEngineSpan);
  }

  *loadAppURL({
    pageId,
    pageIdInUrl,
    rootSpan,
  }: {
    pageId: string;
    pageIdInUrl?: string;
    rootSpan: Span;
  }) {
    try {
      if (!this._urlRedirect) return;

      const loadAppUrlSpan = startNestedSpan("AppEngine.loadAppURL", rootSpan);
      const newURL: string = yield call(
        this._urlRedirect.generateRedirectURL.bind(this),
        pageId,
        pageIdInUrl,
      );

      endSpan(loadAppUrlSpan);

      if (!newURL) return;
      history.replace(newURL);
    } catch (e) {
      log.error(e);
    }
  }
}
