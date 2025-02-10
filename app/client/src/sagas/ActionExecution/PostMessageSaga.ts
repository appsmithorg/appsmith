import { call, spawn } from "redux-saga/effects";
import {
  showToastOnExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import isEmpty from "lodash/isEmpty";
import type { TPostWindowMessageDescription } from "workers/Evaluation/fns/postWindowMessage";

export function* postMessageSaga(action: TPostWindowMessageDescription) {
  const { payload } = action;

  yield spawn(executePostMessage, payload);
}

export function* executePostMessage(
  payload: TPostWindowMessageDescription["payload"],
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
    yield call(showToastOnExecutionError, (error as Error).message);
  }
}
