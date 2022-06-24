import { spawn } from "redux-saga/effects";
import { PostMessageDescription } from "../../entities/DataTree/actionTriggers";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { TriggerMeta } from "./ActionExecutionSagas";
import { isEmpty } from "lodash";

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
    if (targetOrigin === "*") {
      throw new TriggerFailureError(
        "Please enter a valid url as targetOrigin. Failing to provide a specific target discloses the data you send to any interested malicious site.",
      );
    } else if (isEmpty(targetOrigin)) {
      throw new TriggerFailureError("Please enter a target origin URL.");
    } else {
      window.parent.postMessage(message, targetOrigin, undefined);
    }
  } catch (error) {
    logActionExecutionError(
      (error as Error).message,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
  }
}
