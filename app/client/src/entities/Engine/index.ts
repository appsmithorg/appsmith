import { fetchApplication } from "actions/applicationActions";
import { setAppMode, updateAppPersistentStore } from "actions/pageActions";
import {
  ApplicationPayload,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { getPersistentAppStore } from "constants/AppConstants";
import { APP_MODE } from "entities/App";
import log from "loglevel";
import { call, put, select } from "redux-saga/effects";
import { failFastApiCalls } from "sagas/InitSagas";
import { getDefaultPageId } from "sagas/selectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import history from "utils/history";
import URLGenerator from "entities/URLGenerator";
import URLGeneratorFactory from "entities/URLGenerator/factory";
import { updateBranchLocally } from "actions/gitSyncActions";

export type AppEnginePayload = {
  applicationId?: string;
  pageId?: string;
  branch?: string;
  mode: APP_MODE;
};

export interface IAppEngine {
  setupEngine(payload: AppEnginePayload): any;
  loadAppData(payload: AppEnginePayload): any;
  loadAppURL(pageId: string, pageIdInUrl?: string): any;
  loadAppEntities(toLoadPageId: string, applicationId: string): any;
  loadGit(applicationId: string): any;
  completeChore(): any;
}

export default abstract class AppEngine {
  private _mode: APP_MODE;
  constructor(mode: APP_MODE) {
    this._mode = mode;
    this._urlGenerator = null;
  }
  private _urlGenerator: URLGenerator | null;

  abstract loadAppEntities(toLoadPageId: string, applicationId: string): any;
  abstract loadGit(applicationId: string): any;
  abstract startPerformanceTracking(): any;
  abstract stopPerformanceTracking(): any;
  abstract completeChore(): any;

  *loadAppData(payload: AppEnginePayload) {
    const { applicationId, branch, pageId } = payload;
    yield failFastApiCalls(
      [fetchApplication({ applicationId, pageId, mode: this._mode })],
      [
        ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
        ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
      ],
      [
        ReduxActionErrorTypes.FETCH_APPLICATION_ERROR,
        ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
      ],
    );
    const { applicationVersion, id }: ApplicationPayload = yield select(
      getCurrentApplication,
    );
    yield put(updateAppPersistentStore(getPersistentAppStore(id, branch)));
    let toLoadPageId = pageId;
    const defaultPageId: string = yield select(getDefaultPageId);
    toLoadPageId = toLoadPageId || defaultPageId;

    this._urlGenerator = URLGeneratorFactory.create(
      applicationVersion,
      this._mode,
    );
    return { toLoadPageId, applicationId: id };
  }

  *setupEngine(payload: AppEnginePayload): any {
    const { branch } = payload;
    yield put(updateBranchLocally(branch || ""));
    yield put(setAppMode(this._mode));
    yield put({ type: ReduxActionTypes.START_EVALUATION });
  }

  *loadAppURL(pageId: string, pageIdInUrl?: string) {
    try {
      if (this._urlGenerator) {
        const newURL: string = yield call(
          this._urlGenerator.generateURL.bind(this),
          pageId,
          pageIdInUrl,
        );
        newURL && history.replace(newURL);
      }
    } catch (e) {
      log.error(e);
    }
  }
}
