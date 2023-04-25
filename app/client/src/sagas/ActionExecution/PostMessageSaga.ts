import { spawn } from "redux-saga/effects";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import type { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import { isEmpty } from "lodash";
import type { TPostWindowMessageDescription } from "workers/Evaluation/fns/postWindowMessage";

export function* postMessageSaga(
  action: TPostWindowMessageDescription,
  triggerMeta: TriggerMeta,
) {
  const { payload } = action;
  yield spawn(executePostMessage, payload, triggerMeta);
}

export function* executePostMessage(
  payload: TPostWindowMessageDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  const { message, source, targetOrigin } = payload;
  try {
    if (isEmpty(targetOrigin)) {
      throw new TriggerFailureError("Please enter a target origin URL.");
    } else {
      if (source !== "window") {
        const src = document.getElementById(
          `iframe-${source}`,
        ) as HTMLIFrameElement;
        if (src && src.contentWindow) {
          src.contentWindow.postMessage(message, targetOrigin);
        } else {
          throw new TriggerFailureError(
            `Cannot find Iframe with name ${source} on this page`,
          );
        }
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
