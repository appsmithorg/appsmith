import { AppsmithPromisePayload } from "workers/Actions";
import {
  executeActionTriggers,
  executeAppAction,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { all, call } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import log from "loglevel";

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
  let error: unknown;

  try {
    const responses = yield all(
      trigger.executor.map((executionTrigger) =>
        call(executeActionTriggers, executionTrigger, eventType),
      ),
    );
    if (trigger.then) {
      if (trigger.then.length) {
        let responseData: unknown[] = [{}];
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
    error = e;
    if (trigger.catch) {
      let responseData = [e.message];
      if (e instanceof PluginTriggerFailureError) {
        responseData = e.responseData;
      }
      const catchArguments = responseData || [{}];

      yield call(executeAppAction, {
        dynamicString: trigger.catch,
        event: {
          type: eventType,
        },
        responseData: catchArguments,
      });
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

  // Throwing any errors present, which can then be used by the caller
  // to be show in a toast(or debugger etc.)
  if (error) {
    throw error;
  }
}
