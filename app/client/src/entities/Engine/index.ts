import { fetchApplication } from "ee/actions/applicationActions";
import { setAppMode, updateAppStore } from "actions/pageActions";
import type { ApplicationPayload } from "entities/Application";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { getPersistentAppStore } from "constants/AppConstants";
import type { APP_MODE } from "entities/App";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import type { InitConsolidatedApi } from "sagas/InitSagas";
import { failFastApiCalls } from "sagas/InitSagas";
import { getDefaultBasePageId, getDefaultPageId } from "sagas/selectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import history from "utils/history";
import type URLRedirect from "entities/URLRedirect/index";
import URLGeneratorFactory from "entities/URLRedirect/factory";
import { updateBranchLocally } from "actions/gitSyncActions";
import { restoreIDEEditorViewMode } from "actions/ideActions";
import type { Span } from "@opentelemetry/api";
import { endSpan, startNestedSpan } from "UITelemetry/generateTraces";
import { selectGitCurrentBranch } from "selectors/gitModSelectors";
import { applicationArtifact } from "git/artifact-helpers/application";

export interface AppEnginePayload {
  applicationId?: string;
  basePageId?: string;
  branch?: string;
  mode: APP_MODE;
  shouldInitialiseUserDetails?: boolean;
}

export interface IAppEngine {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setupEngine(payload: AppEnginePayload, rootSpan: Span): any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadAppData(payload: AppEnginePayload, rootSpan: Span): any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadAppURL(pageId: string, pageIdInUrl?: string): any;
  loadAppEntities(
    toLoadPageId: string,
    applicationId: string,
    rootSpan: Span,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadGit(applicationId: string): any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // TODO: Fix this the next time the file is edited
  /* eslint-disable @typescript-eslint/no-explicit-any */
  abstract loadAppEntities(
    toLoadPageId: string,
    applicationId: string,
    allResponses: InitConsolidatedApi,
    rootSpan: Span,
  ): any;
  abstract loadGit(applicationId: string, rootSpan: Span): any;
  abstract completeChore(rootSpan: Span): any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  *loadAppData(
    payload: AppEnginePayload,
    allResponses: InitConsolidatedApi,
    rootSpan: Span,
  ) {
    const loadAppDataSpan = startNestedSpan("AppEngine.loadAppData", rootSpan);
    const { applicationId, basePageId, branch } = payload;
    const { pages } = allResponses;
    const page = pages.data?.pages?.find((page) => page.baseId === basePageId);
    const apiCalls: boolean = yield failFastApiCalls(
      [
        fetchApplication({
          applicationId,
          pageId: page?.id,
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
      throw new PageNotFoundError(`Cannot find page with pageId: ${page?.id}`);
    }

    const application: ApplicationPayload = yield select(getCurrentApplication);
    const currentBranch: string | undefined = yield select(
      selectGitCurrentBranch,
      applicationArtifact(application.baseId),
    );

    yield put(
      updateAppStore(
        getPersistentAppStore(application.id, branch || currentBranch),
      ),
    );
    const defaultPageId: string = yield select(getDefaultPageId);
    const defaultPageBaseId: string = yield select(getDefaultBasePageId);
    const toLoadPageId: string = page?.id || defaultPageId;
    const toLoadBasePageId: string = page?.baseId || defaultPageBaseId;

    this._urlRedirect = URLGeneratorFactory.create(
      application.applicationVersion,
      this._mode,
    );
    endSpan(loadAppDataSpan);

    return { toLoadPageId, toLoadBasePageId, applicationId: application.id };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    basePageId,
    basePageIdInUrl,
    rootSpan,
  }: {
    basePageId: string;
    basePageIdInUrl?: string;
    rootSpan: Span;
  }) {
    try {
      if (!this._urlRedirect) return;

      const loadAppUrlSpan = startNestedSpan("AppEngine.loadAppURL", rootSpan);
      const newURL: string = yield call(
        this._urlRedirect.generateRedirectURL.bind(this),
        basePageId,
        basePageIdInUrl,
      );

      endSpan(loadAppUrlSpan);

      if (!newURL) return;

      history.replace(newURL);
    } catch (e) {
      log.error(e);
    }
  }
}
