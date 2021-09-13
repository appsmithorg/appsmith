import { AppsmithPromisePayload } from "workers/Actions";
import {
  executeActionTriggers,
  executeAppAction,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { all, call } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import log from "loglevel";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { ACTION_ANONYMOUS_FUNC_REGEX } from "components/editorComponents/ActionCreator/Fields";

export class TriggerFailureError extends Error {
  error?: Error;
  constructor(reason: string, error?: Error) {
    super(reason);
    this.error = error;
  }
}

export class PluginTriggerFailureError extends TriggerFailureError {
  responseData: unknown[] = [];
  constructor(reason: string, responseData: unknown[]) {
    super(reason);
    this.responseData = responseData;
  }
}

export default function* executePromiseSaga(
  trigger: AppsmithPromisePayload,
  eventType: EventType,
): any {
  try {
    const responses = yield all(
      trigger.executor.map((executionTrigger) =>
        call(executeActionTriggers, executionTrigger, eventType),
      ),
    );
    if (trigger.then) {
      if (trigger.then.length) {
        let responseData: unknown[] = [];
        if (responses.length === 1) {
          responseData = responses[0];
        }
        for (const thenable of trigger.then) {
          responseData = yield call(executeAppAction, {
            dynamicString: thenable,
            event: {
              type: eventType,
            },
            responseData,
          });
        }
      }
    }
  } catch (e) {
    log.error(e);
    if (!trigger.catch) {
      Toaster.show({
        text: e.message || "There was an error while executing",
        variant: Variant.danger,
        showDebugButton: true,
      });
    }
    if (trigger.catch) {
      let responseData = [e.message];
      if (e instanceof PluginTriggerFailureError) {
        responseData = e.responseData;
      }
      // if the catch callback is not an anonymous function, passing arguments will cause errors in execution
      const matches = [...trigger.catch.matchAll(ACTION_ANONYMOUS_FUNC_REGEX)];
      const catchArguments = matches.length ? responseData : undefined;

      yield call(executeAppAction, {
        dynamicString: trigger.catch,
        event: {
          type: eventType,
        },
        responseData: catchArguments,
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
