import { spawn } from "redux-saga/effects";
import { PostMessageDescription } from "../../entities/DataTree/actionTriggers";
import { logActionExecutionError } from "sagas/ActionExecution/errorUtils";
import { TriggerMeta } from "./ActionExecutionSagas";

export function* postMessageSaga(
  payload: PostMessageDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  yield spawn(executePostMessage, payload, triggerMeta);
}

export function* executePostMessage(
  payload: PostMessageDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  const { message, targetOrigin } = payload;
  try {
    window.parent.postMessage(message, targetOrigin, undefined);
  } catch (error) {
    logActionExecutionError(
      error.message,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
  }
}
