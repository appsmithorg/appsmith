import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import type AppEngine from "entities/Engine";
import { type AppEnginePayload, AppEngineApiError } from "entities/Engine";
import AppEngineFactory from "entities/Engine/factory";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ActionPattern } from "redux-saga/effects";
import { take } from "redux-saga/effects";
import { race, put, call, actionChannel } from "redux-saga/effects";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import type { Action } from "redux";

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
    yield put({
      type: ReduxActionTypes.SAFE_CRASH_APPSMITH_REQUEST,
      payload: {
        code: ERROR_CODES.SERVER_ERROR,
      },
    });
  }
}

export default function* appEngineSaga() {
  const channel: ActionPattern<Action<AppEnginePayload>> = yield actionChannel([
    ReduxActionTypes.INITIALIZE_EDITOR,
    ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
  ]);
  while (true) {
    const action: ReduxAction<AppEnginePayload> = yield take(channel);
    yield race({
      task: call(startAppEngine, action),
      cancel: take(ReduxActionTypes.RESET_EDITOR_REQUEST),
    });
  }
}
