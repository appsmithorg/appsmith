import { get } from "lodash";
import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
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
import { resetEditorSuccess } from "actions/initActions";
import {
  getCurrentPageId,
  getIsEditorInitialized,
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
import { updateSlugNamesInURL } from "utils/helpers";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { safeCrashAppRequest } from "../actions/errorActions";

export const URL_CHANGE_ACTIONS = [
  ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
  ReduxActionTypes.UPDATE_PAGE_SUCCESS,
  ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
];

export type ReduxURLChangeAction = {
  type: typeof URL_CHANGE_ACTIONS;
  payload: ApplicationPagePayload | ApplicationPayload | Page;
};

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

export default function* watchInitSagas() {
  yield all([
    takeLatest(
      [
        ReduxActionTypes.INITIALIZE_EDITOR,
        ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      ],
      appEngineSaga,
    ),
    takeLatest(ReduxActionTypes.RESET_EDITOR_REQUEST, resetEditorSaga),
    takeEvery(URL_CHANGE_ACTIONS, updateURLSaga),
  ]);
}
