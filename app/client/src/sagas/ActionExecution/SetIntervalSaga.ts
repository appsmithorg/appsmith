import { SetIntervalDescription } from "entities/DataTree/actionTriggers";
import {
  executeAppAction,
  TriggerMeta,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { call, delay, spawn } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

export function* setIntervalSaga(
  payload: SetIntervalDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  try {
    yield spawn(
      executeInIntervals,
      payload.callback,
      payload.interval,
      triggerMeta,
    );
  } catch (e) {
    // handle
  }
}

function* executeInIntervals(
  callbackFunction: string,
  interval: number,
  triggerMeta: TriggerMeta,
) {
  while (true) {
    yield call(executeAppAction, {
      dynamicString: `{{${callbackFunction}}}`,
      responseData: [{}],
      event: { type: EventType.ON_CLICK },
      triggerPropertyName: triggerMeta.triggerPropertyName,
      source: triggerMeta.source,
    });
    yield delay(interval);
  }
}
