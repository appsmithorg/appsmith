import { AppsmithPromisePayload } from "workers/Actions";
import { ExecuteActionPayloadEvent } from "constants/AppsmithActionConstants/ActionConstants";
import {
  executeActionTriggers,
  executeAppAction,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { all, call } from "redux-saga/effects";

export default function* executePromiseSaga(
  trigger: AppsmithPromisePayload,
  event: ExecuteActionPayloadEvent,
): any {
  let hadError = false;
  try {
    yield all(
      trigger.executor.map((executionTrigger) =>
        call(executeActionTriggers, executionTrigger, event),
      ),
    );
    if (trigger.then) {
      if (trigger.then.length) {
        for (const thenable of trigger.then) {
          yield call(executeAppAction, {
            type: "",
            payload: { dynamicString: thenable, event },
          });
        }
      }
    }
  } catch (e) {
    hadError = true;
    if (trigger.catch) {
      yield call(executeAppAction, {
        type: "",
        payload: { dynamicString: trigger.catch, event },
      });
    }
    if (event.callback) {
      event.callback({ success: false });
    }
  }

  if (trigger.finally) {
    yield call(executeAppAction, {
      type: "",
      payload: { dynamicString: trigger.finally, event },
    });
  }

  if (!hadError) {
    if (event.callback) {
      event.callback({ success: true });
    }
  }
}
