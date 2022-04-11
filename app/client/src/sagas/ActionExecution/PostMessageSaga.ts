import { spawn } from "redux-saga/effects";
import { PostMessageDescription } from "../../entities/DataTree/actionTriggers";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";

export function* postMessageSaga(payload: PostMessageDescription["payload"]) {
  yield spawn(executePostMessage, payload);
}

function* executePostMessage(payload: PostMessageDescription["payload"]) {
  const { message, targetOrigin, transfer } = payload;
  try {
    window.parent.postMessage(
      message,
      targetOrigin || "*",
      transfer || undefined,
    );
  } catch (error) {
    throw new TriggerFailureError(error.message);
  }
}
