import {
  clearAllWindowMessageListenerId,
  windowMessageListenerId,
} from "@appsmith/workers/Evaluation/fns/messageListenerFns/index";
import type { Channel, Task } from "redux-saga";
import { channel } from "redux-saga";
import { spawn, cancel, take, call } from "redux-saga/effects";
import { evalWorker } from "sagas/EvaluationsSaga";

export interface MessageChannelPayload {
  callbackData: unknown;
  origin: string;
}

export let messageListener:
  | {
      unListen: () => void;
      spawnedTask: Task;
    }
  | undefined;

export function* windowMessageListener() {
  if (!messageListener) {
    const messageChannel = channel<MessageChannelPayload>();
    const spawnedTask: Task = yield spawn(
      messageChannelHandler,
      messageChannel,
    );

    const eventListener = getEventListener(messageChannel);

    window.addEventListener("message", eventListener);

    messageListener = {
      unListen: () => window.removeEventListener("message", eventListener),
      spawnedTask,
    };
  }
}

export const getEventListener = (
  messageChannel: Channel<MessageChannelPayload>,
) => {
  return (event: MessageEvent) => {
    if (!checkEventIsFromParent(event)) return;

    messageChannel.put({
      callbackData: event.data,
      origin: event.origin,
    });
  };
};

export default function* messageChannelHandler(
  channel: Channel<MessageChannelPayload>,
) {
  try {
    while (true) {
      const payload: MessageChannelPayload = yield take(channel);
      const { callbackData, origin } = payload;
      yield call(
        evalWorker.ping,
        { data: callbackData, origin },
        windowMessageListenerId,
      );
    }
  } finally {
    channel.close();
  }
}

export function* unListenWindowMessage() {
  if (messageListener) {
    messageListener.unListen();
    yield cancel(messageListener.spawnedTask);
    messageListener = undefined;
  }
}

export const checkEventIsFromParent = (event: MessageEvent) => {
  if (event.source !== window.parent) return false;
  if (event.type !== "message") return false;

  return true;
};

export function* clearAllWindowMessageListeners() {
  yield call(evalWorker.ping, {}, clearAllWindowMessageListenerId);
}
