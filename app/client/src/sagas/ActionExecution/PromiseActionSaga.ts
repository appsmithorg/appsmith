import {
  executeActionTriggers,
  executeAppAction,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { all, call, race, select } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import log from "loglevel";
import { getAppMode } from "selectors/entitiesSelector";
import { APP_MODE } from "entities/App";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  PromiseActionDescription,
  PromiseVariant,
} from "entities/DataTree/actionTriggers";

export class TriggerFailureError extends Error {
  error?: Error;
  constructor(reason: string, error?: Error) {
    super(reason);
    this.error = error;
  }
}

export default function* executePromiseSaga(
  trigger: PromiseActionDescription["payload"],
  eventType: EventType,
): any {
  try {
    const promises = trigger.executor.map((executionTrigger) =>
      call(executeActionTriggers, executionTrigger, eventType),
    );
    let response;
    if (
      trigger.variant === PromiseVariant.ALL ||
      trigger.variant === PromiseVariant.CONSTRUCTOR
    ) {
      response = yield all(promises);
    }
    if (
      trigger.variant === PromiseVariant.RACE ||
      trigger.variant === PromiseVariant.ANY
    ) {
      response = yield race(promises);
    }
    if (trigger.then) {
      if (trigger.then.length) {
        for (const thenable of trigger.then) {
          response = yield call(executeAppAction, {
            dynamicString: thenable,
            responseData: response,
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
