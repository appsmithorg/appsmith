import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type {
  EventType,
  ExecuteTriggerPayload,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";
import * as log from "loglevel";
import { all, call, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  evaluateAndExecuteDynamicTrigger,
  evaluateArgumentSaga,
  evaluateSnippetSaga,
  setAppVersionOnWorkerSaga,
} from "sagas/EvaluationsSaga";
import navigateActionSaga from "sagas/ActionExecution/NavigateActionSaga";
import downloadSaga from "sagas/ActionExecution/DownloadActionSaga";
import copySaga from "sagas/ActionExecution/CopyActionSaga";
import resetWidgetActionSaga from "sagas/ActionExecution/ResetWidgetActionSaga";
import showAlertSaga from "sagas/ActionExecution/ShowAlertActionSaga";
import executePluginActionTriggerSaga from "sagas/ActionExecution/PluginActionSaga";
import { clearActionResponse } from "actions/pluginActionActions";
import {
  closeModalSaga,
  openModalSaga,
} from "sagas/ActionExecution/ModalSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  logActionExecutionError,
  TriggerFailureError,
  UncaughtPromiseError,
} from "sagas/ActionExecution/errorUtils";
import {
  getCurrentLocationSaga,
  stopWatchCurrentLocation,
  watchCurrentLocation,
} from "sagas/ActionExecution/geolocationSaga";
import { postMessageSaga } from "sagas/ActionExecution/PostMessageSaga";
import type { ActionDescription } from "@appsmith/workers/Evaluation/fns";

export type TriggerMeta = {
  source?: TriggerSource;
  triggerPropertyName?: string;
};

/**
 * The controller saga that routes different trigger effects to its executor sagas
 * @param trigger The trigger information with trigger type
 * @param eventType Widget/Platform event which triggered this action
 * @param triggerMeta Where the trigger originated from
 */
export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
  triggerMeta: TriggerMeta,
): any {
  // when called via a promise, a trigger can return some value to be used in .then
  let response: unknown[] = [];
  switch (trigger.type) {
    case "RUN_PLUGIN_ACTION":
      response = yield call(executePluginActionTriggerSaga, trigger, eventType);
      break;
    case "CLEAR_PLUGIN_ACTION":
      yield put(clearActionResponse(trigger.payload.actionId));
      break;
    case "NAVIGATE_TO":
      yield call(navigateActionSaga, trigger);
      break;
    case "SHOW_ALERT":
      yield call(showAlertSaga, trigger);
      break;
    case "SHOW_MODAL_BY_NAME":
      yield call(openModalSaga, trigger);
      break;
    case "CLOSE_MODAL":
      yield call(closeModalSaga, trigger);
      break;
    case "DOWNLOAD":
      yield call(downloadSaga, trigger);
      break;
    case "COPY_TO_CLIPBOARD":
      yield call(copySaga, trigger);
      break;
    case "RESET_WIDGET_META_RECURSIVE_BY_NAME":
      yield call(resetWidgetActionSaga, trigger);
      break;
    case "GET_CURRENT_LOCATION":
      response = yield call(
        getCurrentLocationSaga,
        trigger,
        eventType,
        triggerMeta,
      );
      break;
    case "WATCH_CURRENT_LOCATION":
      response = yield call(
        watchCurrentLocation,
        trigger,
        eventType,
        triggerMeta,
      );
      break;
    case "STOP_WATCHING_CURRENT_LOCATION":
      response = yield call(stopWatchCurrentLocation, eventType, triggerMeta);
      break;
    case "POST_MESSAGE":
      yield call(postMessageSaga, trigger, triggerMeta);
      break;
    default:
      log.error("Trigger type unknown", trigger);
      throw Error("Trigger type unknown");
  }
  return response;
}

export function* executeAppAction(payload: ExecuteTriggerPayload): any {
  const {
    callbackData,
    dynamicString,
    event: { type },
    globalContext,
    source,
    triggerPropertyName,
  } = payload;

  log.debug({ dynamicString, callbackData, globalContext });
  if (dynamicString === undefined) {
    throw new Error("Executing undefined action");
  }

  return yield call(
    evaluateAndExecuteDynamicTrigger,
    dynamicString,
    type,
    { source, triggerPropertyName },
    callbackData,
    globalContext,
  );
}

function* initiateActionTriggerExecution(
  action: ReduxAction<ExecuteTriggerPayload>,
) {
  const { event, source, triggerPropertyName } = action.payload;
  // Clear all error for this action trigger. In case the error still exists,
  // it will be created again while execution
  AppsmithConsole.deleteErrors([
    { id: `${source?.id}-${triggerPropertyName}` },
  ]);
  try {
    yield call(executeAppAction, action.payload);
    if (event.callback) {
      event.callback({ success: true });
    }
  } catch (e) {
    if (e instanceof UncaughtPromiseError || e instanceof TriggerFailureError) {
      logActionExecutionError(e.message, source, triggerPropertyName);
    }
    // handle errors here
    if (event.callback) {
      event.callback({ success: false });
    }
    log.error(e);
  }
}

export function* watchActionExecutionSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.EXECUTE_TRIGGER_REQUEST,
      initiateActionTriggerExecution,
    ),
    takeLatest(
      ReduxActionTypes.SET_APP_VERSION_ON_WORKER,
      setAppVersionOnWorkerSaga,
    ),
    takeLatest(ReduxActionTypes.EVALUATE_SNIPPET, evaluateSnippetSaga),
    takeLatest(ReduxActionTypes.EVALUATE_ARGUMENT, evaluateArgumentSaga),
  ]);
}
