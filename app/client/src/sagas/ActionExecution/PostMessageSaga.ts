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
  const { message, source, targetOrigin } = payload;
  try {
    if (isEmpty(targetOrigin)) {
      throw new TriggerFailureError("Please enter a target origin URL.");
    } else {
      if (source) {
        const src = document.getElementById(source);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        src.contentWindow.postMessage(message, targetOrigin, undefined);
      } else {
        window.parent.postMessage(message, targetOrigin, undefined);
      }
    }
  } catch (error) {
    logActionExecutionError(
      (error as Error).message,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
  }
}
