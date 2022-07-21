import {
  ClearIntervalDescription,
  SetIntervalDescription,
} from "entities/DataTree/actionTriggers";
import {
  executeAppAction,
  TriggerMeta,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { call, delay, spawn } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";

const TIMER_WITHOUT_ID_KEY = "timerWithoutId";

const activeTimers: Record<string, true | string> = {
  [TIMER_WITHOUT_ID_KEY]: true,
};

export function* setIntervalSaga(
  payload: SetIntervalDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  if (payload.id) {
    activeTimers[payload.id] = payload.callback;
  }

  yield spawn(executeInIntervals, payload, eventType, triggerMeta);
}

function* executeInIntervals(
  payload: SetIntervalDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const { callback, id = TIMER_WITHOUT_ID_KEY, interval } = payload;
  while (
    // only execute if the id exists in the activeTimers obj
    id in activeTimers &&
    /*
     While editing the callback can change for the same id.
     At that time we want only execute the new callback
     so end the loop if the callback is not the same as the one this
     saga was started

     But if no id is provided, it will always run
    */
    (activeTimers[id] === callback || id === TIMER_WITHOUT_ID_KEY)
  ) {
    // Even if there is an error, the set interval should still keep
    // running. This is according to the spec of setInterval
    try {
      yield call(executeAppAction, {
        dynamicString: `{{${callback}}}`,
        // pass empty object to execute it as a callback function
        callbackData: [{}],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    } catch (error) {
      logActionExecutionError(
        (error as Error).message,
        triggerMeta.source,
        triggerMeta.triggerPropertyName,
      );
    }
    yield delay(interval);
  }
}

export function* clearIntervalSaga(
  payload: ClearIntervalDescription["payload"],
) {
  if (!(payload.id in activeTimers)) {
    throw new TriggerFailureError(
      `Failed to clear interval. No timer active with id "${payload.id}"`,
    );
  }
  delete activeTimers[payload.id];
}
