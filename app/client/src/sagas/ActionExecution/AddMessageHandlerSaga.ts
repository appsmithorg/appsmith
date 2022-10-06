import { spawn } from "redux-saga/effects";
import { AddMessageHandlerDescription } from "../../entities/DataTree/actionTriggers";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { TriggerMeta } from "./ActionExecutionSagas";

export function* addMessageHandlerSaga(
  payload: AddMessageHandlerDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  yield spawn(addExecuteMessageHandler, payload, triggerMeta);
}

export function* addExecuteMessageHandler(
  payload: AddMessageHandlerDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  const { handler } = payload;
  try {
    if (!handler) {
      throw new TriggerFailureError("Message handler is empty.");
    }
    window.addEventListener("message", handler);
  } catch (error) {
    logActionExecutionError(
      (error as Error).message,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
  }
}
