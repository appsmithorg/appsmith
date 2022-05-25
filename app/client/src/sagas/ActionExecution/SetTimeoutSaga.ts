import {
  ClearTimeoutDescription,
  SetTimeoutDescription,
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

export function* setTimeoutSaga(
  payload: SetTimeoutDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  if (payload.id) {
    activeTimers[payload.id] = payload.callback;
  }

  yield spawn(executeAfterDelay, payload, eventType, triggerMeta);
}

function* executeAfterDelay(
  payload: SetTimeoutDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const { callback, id = TIMER_WITHOUT_ID_KEY, interval } = payload;
  if (
    // only execute if the id exists in the activeTimers obj
    id in activeTimers
    //&&
    /*
       While editing the callback can change for the same id.
       At that time we want only execute the new callback
       so end the loop if the callback is not the same as the one this
       saga was started
  
       But if no id is provided, it will always run
      */
    //   (activeTimers[id] === callback || id === TIMER_WITHOUT_ID_KEY)
  ) {
    // Even if there is an error, the set interval should still keep
    // running. This is according to the spec of setInterval
    try {
      yield delay(interval);
      yield call(executeAppAction, {
        dynamicString: `{{${callback}}}`,
        // pass empty object to execute it as a callback function
        callbackData: [{}],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    } catch (e) {
      logActionExecutionError(
        e.message,
        triggerMeta.source,
        triggerMeta.triggerPropertyName,
      );
    }
  }
}

export function* clearTimeoutSaga(payload: ClearTimeoutDescription["payload"]) {
  if (!(payload.id in activeTimers)) {
    throw new TriggerFailureError(
      `Failed to clear timeout. No timer active with id "${payload.id}"`,
    );
  }
  delete activeTimers[payload.id];
}
