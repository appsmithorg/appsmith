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

const activeTimers: Record<string, true> = {
  timerWithoutId: true,
};

export function* setIntervalSaga(
  payload: SetIntervalDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  if (payload.id) {
    activeTimers[payload.id] = true;
  }

  yield spawn(executeInIntervals, payload, triggerMeta);
}

function* executeInIntervals(
  payload: SetIntervalDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  const { callback, id = "timerWithoutId", interval } = payload;
  while (id in activeTimers) {
    try {
      yield call(executeAppAction, {
        dynamicString: `{{${callback}}}`,
        responseData: [{}],
        event: { type: EventType.ON_CLICK },
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
    yield delay(interval);
  }
}

export function* clearIntervalSaga(
  payload: ClearIntervalDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  if (!(payload.id in activeTimers)) {
    throw new TriggerFailureError(
      `Failed to clear interval. No timer active with id "${payload.id}"`,
      triggerMeta,
    );
  }
  delete activeTimers[payload.id];
}
