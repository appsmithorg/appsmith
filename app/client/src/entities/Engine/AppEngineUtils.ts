import { safeCrashAppRequest } from "actions/errorActions";
import { all } from "axios";
import {
  type ReduxAction,
  type ReduxActionWithoutPayload,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import type { APP_MODE } from "entities/App";
import { take, get } from "lodash";
import { delay, put, race, select } from "redux-saga/effects";
import { getIsWidgetConfigBuilt } from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

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

export function* waitForWidgetConfigBuild() {
  const isBuilt: boolean = yield select(getIsWidgetConfigBuilt);
  if (!isBuilt) {
    yield take(ReduxActionTypes.WIDGET_INIT_SUCCESS);
  }
}
