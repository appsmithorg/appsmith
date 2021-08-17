import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import * as log from "loglevel";
import { all, call, put, takeEvery } from "redux-saga/effects";
import { evaluateDynamicTrigger } from "sagas/EvaluationsSaga";
import AppsmithConsole from "utils/AppsmithConsole";
import navigateActionSaga from "sagas/ActionExecution/NavigateActionSaga";
import storeValueLocally from "sagas/ActionExecution/StoreActionSaga";
import downloadSaga from "sagas/ActionExecution/DownloadActionSaga";
import copySaga from "sagas/ActionExecution/CopyActionSaga";
import resetWidgetActionSaga from "sagas/ActionExecution/ResetWidgetActionSaga";
import showAlertSaga from "sagas/ActionExecution/ShowAlertActionSaga";
import executePluginActionTriggerSaga from "sagas/ActionExecution/PluginActionSaga";
import executePromiseSaga from "sagas/ActionExecution/PromiseActionSaga";
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";
import { clearActionResponse } from "actions/pluginActionActions";

export class TriggerEvaluationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
) {
  switch (trigger.type) {
    case ActionTriggerType.PROMISE:
      yield call(executePromiseSaga, trigger.payload, eventType);
      break;
    case ActionTriggerType.RUN_PLUGIN_ACTION:
      yield call(executePluginActionTriggerSaga, trigger.payload, eventType);
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
      yield put(trigger);
      break;
    case ActionTriggerType.CLOSE_MODAL:
      yield put(trigger);
      AppsmithConsole.info({
        text: `closeModal(${trigger.payload.modalName}) was triggered`,
      });
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
    default:
      log.error("Trigger type unknown", trigger);
      throw Error("Trigger type unknown");
  }
}

export function* executeAppAction(payload: ExecuteTriggerPayload) {
  const {
    dynamicString,
    event: { type },
    responseData,
  } = payload;
  log.debug({ dynamicString, responseData });
  if (dynamicString === undefined) {
    throw new Error("Executing undefined action");
  }
  const triggers = yield call(
    evaluateDynamicTrigger,
    dynamicString,
    responseData,
  );

  log.debug({ triggers });
  if (triggers && triggers.length) {
    yield all(
      triggers.map((trigger: ActionDescription) =>
        call(executeActionTriggers, trigger, type),
      ),
    );
  }
}

function* initiateActionTriggerExecution(
  action: ReduxAction<ExecuteTriggerPayload>,
) {
  const { event } = action.payload;
  try {
    yield call(executeAppAction, action.payload);
    if (event.callback) {
      event.callback({ success: true });
    }
  } catch (e) {
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
  ]);
}
