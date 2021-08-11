import { AppsmithPromisePayload } from "workers/Actions";
import {
  executeActionTriggers,
  executeAppAction,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { all, call, select } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import log from "loglevel";
import { getAppMode } from "selectors/entitiesSelector";
import { APP_MODE } from "entities/App";
import { Toaster } from "components/ads/Toast";
import { createMessage, ERROR_PLUGIN_ACTION_EXECUTE } from "constants/messages";
import { Variant } from "components/ads/common";

export class TriggerFailureError extends Error {
  error?: Error;
  constructor(reason: string, error?: Error) {
    super(reason);
    this.error = error;
  }
}

export default function* executePromiseSaga(
  trigger: AppsmithPromisePayload,
  eventType: EventType,
): any {
  try {
    yield all(
      trigger.executor.map((executionTrigger) =>
        call(executeActionTriggers, executionTrigger, eventType),
      ),
    );
    if (trigger.then) {
      if (trigger.then.length) {
        for (const thenable of trigger.then) {
          yield call(executeAppAction, {
            dynamicString: thenable,
            event: {
              type: eventType,
            },
          });
        }
      }
    }
  } catch (e) {
    log.error(e);
    const appMode = yield select(getAppMode);
    if (appMode === APP_MODE.EDIT) {
      Toaster.show({
        text: "There was an error while executing",
        variant: Variant.danger,
        showDebugButton: true,
      });
    }
    if (trigger.catch) {
      yield call(executeAppAction, {
        dynamicString: trigger.catch,
        event: {
          type: eventType,
        },
        responseData: [e.message],
      });
    } else {
      throw new TriggerFailureError("Uncaught promise rejection", e);
    }
  }

  if (trigger.finally) {
    yield call(executeAppAction, {
      dynamicString: trigger.finally,
      event: {
        type: eventType,
      },
    });
  }
}
