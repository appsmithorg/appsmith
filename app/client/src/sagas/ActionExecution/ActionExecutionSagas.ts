import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import * as log from "loglevel";
import { all, call, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  evaluateDynamicTrigger,
  evaluateSnippetSaga,
  evaluateArgumentSaga,
} from "sagas/EvaluationsSaga";
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
import {
  openModalSaga,
  closeModalSaga,
} from "sagas/ActionExecution/ModalSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { createMessage, DEBUGGER_TRIGGER_ERROR } from "constants/messages";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

export class TriggerEvaluationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
) {
  // when called via a promise, a trigger can return some value to be used in .then
  let response: unknown[] = [];
  switch (trigger.type) {
    case ActionTriggerType.PROMISE:
      yield call(executePromiseSaga, trigger.payload, eventType);
      break;
    case ActionTriggerType.RUN_PLUGIN_ACTION:
      response = yield call(
        executePluginActionTriggerSaga,
        trigger.payload,
        eventType,
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
  } = payload;
  log.debug({ dynamicString, responseData });
  if (dynamicString === undefined) {
    throw new Error("Executing undefined action");
  }

  try {
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
  } catch (e) {
    throw e;
  }
}

function* initiateActionTriggerExecution(
  action: ReduxAction<ExecuteTriggerPayload>,
) {
  const { event, source, triggerPropertyName } = action.payload;
  try {
    yield call(executeAppAction, action.payload);

    if (event.callback) {
      event.callback({ success: true });
    }
    AppsmithConsole.deleteError(`${source?.id}-${triggerPropertyName}`);
  } catch (e) {
    // handle errors here
    if (event.callback) {
      event.callback({ success: false });
    }
    log.error(e);

    AppsmithConsole.addError({
      id: `${source?.id}-${triggerPropertyName}`,
      logType: LOG_TYPE.TRIGGER_EVAL_ERROR,
      text: createMessage(DEBUGGER_TRIGGER_ERROR, triggerPropertyName),
      source: {
        type: ENTITY_TYPE.WIDGET,
        id: source?.id ?? "",
        name: source?.name ?? "",
        propertyPath: triggerPropertyName,
      },
      messages: [
        {
          type:
            e instanceof TriggerEvaluationError
              ? PropertyEvaluationErrorType.PARSE
              : undefined,
          message: e.message,
        },
      ],
    });

    Toaster.show({
      text: e.message || "There was an error while executing trigger",
      variant: Variant.danger,
      showDebugButton: true,
    });
  }
}

export function* watchActionExecutionSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.EXECUTE_TRIGGER_REQUEST,
      initiateActionTriggerExecution,
    ),
    takeLatest(ReduxActionTypes.EVALUATE_SNIPPET, evaluateSnippetSaga),
    takeLatest(ReduxActionTypes.EVALUATE_ARGUMENT, evaluateArgumentSaga),
  ]);
}
