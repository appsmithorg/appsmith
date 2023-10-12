import { get } from "lodash";
import {
  all,
  call,
  delay,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import type {
  ApplicationPayload,
  Page,
  ReduxAction,
  ReduxActionWithoutPayload,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { resetApplicationWidgets, resetPageList } from "actions/pageActions";
import { resetCurrentApplication } from "@appsmith/actions/applicationActions";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { resetRecentEntities } from "actions/globalSearchActions";
import {
  initAppViewer,
  initEditor,
  resetEditorSuccess,
} from "actions/initActions";
import {
  getCurrentPageId,
  getIsEditorInitialized,
  getIsWidgetConfigBuilt,
  selectCurrentApplicationSlug,
} from "selectors/editorSelectors";
import { getIsInitialized as getIsViewerInitialized } from "selectors/appViewSelectors";
import { enableGuidedTour } from "actions/onboardingActions";
import { setPreviewModeAction } from "actions/editorActions";
import type { AppEnginePayload } from "entities/Engine";
import type AppEngine from "entities/Engine";
import { AppEngineApiError } from "entities/Engine";
import AppEngineFactory from "entities/Engine/factory";
import type { ApplicationPagePayload } from "@appsmith/api/ApplicationApi";
import { getSearchQuery, updateSlugNamesInURL } from "utils/helpers";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { safeCrashAppRequest } from "../actions/errorActions";
import { resetSnipingMode } from "actions/propertyPaneActions";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import {
  isEditorPath,
  isViewerPath,
} from "@appsmith/pages/Editor/Explorer/helpers";
import { APP_MODE } from "../entities/App";
import {
  GIT_BRANCH_QUERY_KEY,
  matchBuilderPath,
  matchViewerPath,
} from "../constants/routes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";

export const URL_CHANGE_ACTIONS = [
  ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
  ReduxActionTypes.UPDATE_PAGE_SUCCESS,
  ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
];

export interface ReduxURLChangeAction {
  type: typeof URL_CHANGE_ACTIONS;
  payload: ApplicationPagePayload | ApplicationPayload | Page;
}

export function* failFastApiCalls(
  triggerActions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
  successActions: string[],
  failureActions: string[],
) {
  yield all(triggerActions.map((triggerAction) => put(triggerAction)));
  const effectRaceResult: { success: boolean; failure: boolean } = yield race({
    success: all(successActions.map((successAction) => take(successAction))),
    failure: take(failureActions),
  });
  if (effectRaceResult.failure) {
    yield put(
      safeCrashAppRequest(get(effectRaceResult, "failure.payload.error.code")),
    );
    return false;
  }
  return true;
}

export function* waitForWidgetConfigBuild() {
  const isBuilt: boolean = yield select(getIsWidgetConfigBuilt);
  if (!isBuilt) {
    yield take(ReduxActionTypes.WIDGET_INIT_SUCCESS);
  }
}

export function* reportSWStatus() {
  const mode: APP_MODE = yield select(getAppMode);
  const startTime = Date.now();
  if ("serviceWorker" in navigator) {
    const result: { success: any; failed: any } = yield race({
      success: navigator.serviceWorker.ready.then((reg) => ({
        reg,
        timeTaken: Date.now() - startTime,
      })),
      failed: delay(20000),
    });
    if (result.success) {
      AnalyticsUtil.logEvent("SW_REGISTRATION_SUCCESS", {
        message: "Service worker is active",
        mode,
        timeTaken: result.success.timeTaken,
      });
      const referenceMap = new Map();
      const inverseRefMap = new Map();

      navigator.serviceWorker &&
        navigator.serviceWorker.addEventListener("message", (event) => {
          const { data } = event;
          const port = event.ports[0];
          let result = null;
          if (data) {
            const source = referenceMap.get(data["_referenceId"]) || window;
            if (data.action === "APPLY") {
              try {
                const ctx = referenceMap.get(data["_ctxReferenceId"]) || window;
                const args = data.args.map((arg: any) => {
                  if (typeof arg === "object" && arg["_referenceId"]) {
                    return referenceMap.get(arg["_referenceId"]);
                  }
                  return arg;
                });
                result = source.apply(ctx, args);
              } catch (e) {
                result = null;
              }
            } else if (data.action === "GET") {
              result = source[data.property];
            } else if (data.action === "SET") {
              source[data.property] = data.args[0];
              result = source[data.property];
            }
            try {
              port.postMessage({ data: result });
            } catch (e) {
              const _referenceType = typeof result;
              let _referenceId = inverseRefMap.get(result);
              if (!_referenceId) {
                _referenceId = window.crypto.randomUUID();
                referenceMap.set(_referenceId, result);
                inverseRefMap.set(result, _referenceId);
              }
              port.postMessage({ data: { _referenceId, _referenceType } });
            }
          }
        });
    } else {
      AnalyticsUtil.logEvent("SW_REGISTRATION_FAILED", {
        message: "Service worker is not active in 20s",
        mode,
      });
    }
  } else {
    AnalyticsUtil.logEvent("SW_REGISTRATION_FAILED", {
      message: "Service worker is not supported",
      mode,
    });
  }
}

export function* startAppEngine(action: ReduxAction<AppEnginePayload>) {
  try {
    const engine: AppEngine = AppEngineFactory.create(
      action.payload.mode,
      action.payload.mode,
    );
    engine.startPerformanceTracking();
    yield call(engine.setupEngine, action.payload);
    const { applicationId, toLoadPageId } = yield call(
      engine.loadAppData,
      action.payload,
    );
    yield call(engine.loadAppURL, toLoadPageId, action.payload.pageId);
    yield call(engine.loadAppEntities, toLoadPageId, applicationId);
    yield call(engine.loadGit, applicationId);
    yield call(engine.completeChore);
    yield put(generateAutoHeightLayoutTreeAction(true, false));
    engine.stopPerformanceTracking();
  } catch (e) {
    log.error(e);
    if (e instanceof AppEngineApiError) return;
    Sentry.captureException(e);
    yield put(safeCrashAppRequest());
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
  yield put(resetSnipingMode());
  yield put(setExplorerActiveAction(true));
  yield put(setExplorerPinnedAction(true));
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

function* updateURLSaga(action: ReduxURLChangeAction) {
  yield call(waitForInit);
  const currentPageId: string = yield select(getCurrentPageId);
  const applicationSlug: string = yield select(selectCurrentApplicationSlug);
  const payload = action.payload;

  if ("applicationVersion" in payload) {
    updateSlugNamesInURL({ applicationSlug: payload.slug });
    return;
  }
  if ("pageId" in payload) {
    if (payload.pageId !== currentPageId) return;
    updateSlugNamesInURL({
      pageSlug: payload.slug,
      customSlug: payload.customSlug || "",
      applicationSlug,
    });
    return;
  }
  if (payload.id !== currentPageId) return;
  updateSlugNamesInURL({
    pageSlug: payload.slug,
    customSlug: payload.customSlug || "",
    applicationSlug,
  });
}

function* appEngineSaga(action: ReduxAction<AppEnginePayload>) {
  yield race({
    task: call(startAppEngine, action),
    cancel: take(ReduxActionTypes.RESET_EDITOR_REQUEST),
  });
}

function* eagerPageInitSaga() {
  const url = window.location.pathname;
  const search = window.location.search;
  if (isEditorPath(url)) {
    const {
      params: { applicationId, pageId },
    } = matchBuilderPath(url);
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);
    if (pageId) {
      yield put(
        initEditor({
          pageId,
          applicationId,
          branch,
          mode: APP_MODE.EDIT,
        }),
      );
    }
  } else if (isViewerPath(url)) {
    const {
      params: { applicationId, pageId },
    } = matchViewerPath(url);
    const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);
    if (applicationId || pageId) {
      yield put(
        initAppViewer({
          applicationId,
          branch,
          pageId,
          mode: APP_MODE.PUBLISHED,
        }),
      );
    }
  }
}

export default function* watchInitSagas() {
  yield all([
    takeLeading(
      [
        ReduxActionTypes.INITIALIZE_EDITOR,
        ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      ],
      appEngineSaga,
    ),
    takeLatest(ReduxActionTypes.RESET_EDITOR_REQUEST, resetEditorSaga),
    takeEvery(URL_CHANGE_ACTIONS, updateURLSaga),
    takeEvery(ReduxActionTypes.INITIALIZE_CURRENT_PAGE, eagerPageInitSaga),
  ]);
}
