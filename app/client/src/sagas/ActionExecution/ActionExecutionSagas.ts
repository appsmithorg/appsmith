import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  EventType,
  ExecuteTriggerPayload,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";
import * as log from "loglevel";
import { all, call, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  evaluateArgumentSaga,
  evaluateAndExecuteDynamicTrigger,
  evaluateSnippetSaga,
  setAppVersionOnWorkerSaga,
} from "sagas/EvaluationsSaga";
import navigateActionSaga from "sagas/ActionExecution/NavigateActionSaga";
import storeValueLocally from "sagas/ActionExecution/StoreActionSaga";
import downloadSaga from "sagas/ActionExecution/DownloadActionSaga";
import copySaga from "sagas/ActionExecution/CopyActionSaga";
import resetWidgetActionSaga from "sagas/ActionExecution/ResetWidgetActionSaga";
import showAlertSaga from "sagas/ActionExecution/ShowAlertActionSaga";
import executePluginActionTriggerSaga from "sagas/ActionExecution/PluginActionSaga";
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";
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
  clearIntervalSaga,
  setIntervalSaga,
} from "sagas/ActionExecution/SetIntervalSaga";
import {
  getCurrentLocationSaga,
  stopWatchCurrentLocation,
  watchCurrentLocation,
} from "sagas/ActionExecution/GetCurrentLocationSaga";

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
    case ActionTriggerType.RUN_PLUGIN_ACTION:
      response = yield call(
        executePluginActionTriggerSaga,
        trigger.payload,
        eventType,
        triggerMeta,
      );
      break;
    case ActionTriggerType.CLEAR_PLUGIN_ACTION:
      yield put(clearActionResponse(trigger.payload.actionId));
      break;
    case ActionTriggerType.NAVIGATE_TO:
      yield call(navigateActionSaga, trigger.payload);
      break;
    case ActionTriggerType.SHOW_ALERT:
      yield call(showAlertSaga, trigger.payload);
      break;
    case ActionTriggerType.SHOW_MODAL_BY_NAME:
      yield call(openModalSaga, trigger);
      break;
    case ActionTriggerType.CLOSE_MODAL:
      yield call(closeModalSaga, trigger);
      break;
    case ActionTriggerType.STORE_VALUE:
      yield call(storeValueLocally, trigger.payload);
      break;
    case ActionTriggerType.DOWNLOAD:
      yield call(downloadSaga, trigger.payload);
      break;
    case ActionTriggerType.COPY_TO_CLIPBOARD:
      yield call(copySaga, trigger.payload);
      break;
    case ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME:
      yield call(resetWidgetActionSaga, trigger.payload);
      break;
    case ActionTriggerType.SET_INTERVAL:
      yield call(setIntervalSaga, trigger.payload, eventType, triggerMeta);
      break;
    case ActionTriggerType.CLEAR_INTERVAL:
      yield call(clearIntervalSaga, trigger.payload);
      break;
    case ActionTriggerType.GET_CURRENT_LOCATION:
      response = yield call(
        getCurrentLocationSaga,
        trigger.payload,
        eventType,
        triggerMeta,
      );
      break;

    case ActionTriggerType.WATCH_CURRENT_LOCATION:
      response = yield call(
        watchCurrentLocation,
        trigger.payload,
        eventType,
        triggerMeta,
      );
      break;

    case ActionTriggerType.STOP_WATCHING_CURRENT_LOCATION:
      response = yield call(stopWatchCurrentLocation, eventType, triggerMeta);
      break;
    default:
      log.error("Trigger type unknown", trigger);
      throw Error("Trigger type unknown");
  }
  return response;
}

export function* executeAppAction(payload: ExecuteTriggerPayload) {
  const {
    dynamicString,
    event: { type },
    responseData,
    source,
    triggerPropertyName,
  } = payload;
  log.debug({ dynamicString, responseData });
  if (dynamicString === undefined) {
    throw new Error("Executing undefined action");
  }

  yield call(
    evaluateAndExecuteDynamicTrigger,
    dynamicString,
    type,
    { source, triggerPropertyName },
    responseData,
  );
}

function* initiateActionTriggerExecution(
  action: ReduxAction<ExecuteTriggerPayload>,
) {
  const { event, source, triggerPropertyName } = action.payload;
  // Clear all error for this action trigger. In case the error still exists,
  // it will be created again while execution
  AppsmithConsole.deleteError(`${source?.id}-${triggerPropertyName}`);
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
