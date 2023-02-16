import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Channel, channel, Task } from "redux-saga";
import { spawn, cancel, take, call } from "redux-saga/effects";
import {
  executeAppAction,
  TriggerMeta,
} from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import {
  TUnlistenWindowMessageDescription,
  TWindowMessageListenerDescription,
} from "@appsmith/workers/Evaluation/fns/messageListenerFns";

export const __listenersMap__ = new Map<
  string,
  {
    unListen: () => void;
    spawnedTask: Task;
    triggerMeta: TriggerMeta;
  }
>();

export interface MessageChannelPayload {
  callbackString: string;
  callbackData: unknown;
  eventType: EventType;
  triggerMeta: TriggerMeta;
}

export default function* messageChannelHandler(
  channel: Channel<MessageChannelPayload>,
) {
  try {
    while (true) {
      const payload: MessageChannelPayload = yield take(channel);
      const { callbackData, callbackString, eventType, triggerMeta } = payload;
      yield call(executeAppAction, {
        dynamicString: callbackString,
        callbackData: [callbackData],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    }
  } finally {
    channel.close();
  }
}

export function* windowMessageListener(
  actionPayload: TWindowMessageListenerDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const urlError = checkUrlError(actionPayload.acceptedOrigin);
  if (urlError) {
    AppsmithConsole.error({
      text: urlError,
      state: {
        domain: actionPayload.acceptedOrigin,
      },
      source: {
        id: triggerMeta.source?.id ?? "",
        name: triggerMeta.source?.name ?? "",
        type:
          eventType === EventType.ON_JS_FUNCTION_EXECUTE
            ? ENTITY_TYPE.JSACTION
            : ENTITY_TYPE.WIDGET,
      },
    });
    return;
  }

  const existingListener = __listenersMap__.get(actionPayload.acceptedOrigin);
  if (existingListener) {
    AppsmithConsole.warning({
      text: `Already listening to ${actionPayload.acceptedOrigin}.`,
      source: {
        id: triggerMeta.source?.id ?? "",
        name: triggerMeta.source?.name ?? "",
        type:
          eventType === EventType.ON_JS_FUNCTION_EXECUTE
            ? ENTITY_TYPE.JSACTION
            : ENTITY_TYPE.WIDGET,
      },
    });
    return;
  }

  const messageChannel = channel<MessageChannelPayload>();
  const spawnedTask: Task = yield spawn(messageChannelHandler, messageChannel);

  const eventListener = getEventListener(
    actionPayload,
    messageChannel,
    eventType,
    triggerMeta,
  );

  window.addEventListener("message", eventListener);

  __listenersMap__.set(actionPayload.acceptedOrigin, {
    unListen: () => window.removeEventListener("message", eventListener),
    spawnedTask,
    triggerMeta,
  });
}

export function* unListenWindowMessage(
  actionPayload: TUnlistenWindowMessageDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const urlError = checkUrlError(actionPayload.origin);
  if (urlError) {
    AppsmithConsole.error({
      text: urlError,
      state: {
        domain: actionPayload.origin,
      },
      source: {
        id: triggerMeta.source?.id ?? "",
        name: triggerMeta.source?.name ?? "",
        type:
          eventType === EventType.ON_JS_FUNCTION_EXECUTE
            ? ENTITY_TYPE.JSACTION
            : ENTITY_TYPE.WIDGET,
      },
    });
    return;
  }

  const existingListener = __listenersMap__.get(actionPayload.origin);
  if (existingListener) {
    existingListener.unListen();
    __listenersMap__.delete(actionPayload.origin);
    yield cancel(existingListener.spawnedTask);
  } else {
    AppsmithConsole.warning({
      text: `No subcriptions to ${actionPayload.origin}`,
      source: {
        id: triggerMeta.source?.id ?? "",
        name: triggerMeta.source?.name ?? "",
        type:
          eventType === EventType.ON_JS_FUNCTION_EXECUTE
            ? ENTITY_TYPE.JSACTION
            : ENTITY_TYPE.WIDGET,
      },
    });
  }
}

export function* clearAllWindowMessageListeners() {
  for (const [, listener] of __listenersMap__) {
    listener.unListen();
    yield cancel(listener.spawnedTask);
  }
  __listenersMap__.clear();
}

export const checkUrlError = (urlString: string) => {
  try {
    const url = new URL(urlString);

    if (url.search.length > 0) {
      return `Please use a valid domain name. e.g. https://domain.com (No query params)`;
    }

    if (url.pathname !== "/") {
      return `Please use a valid domain name. e.g. https://domain.com (No sub-directories)`;
    }

    if (urlString[urlString.length - 1] === "/") {
      return `Please use a valid domain name. e.g. https://domain.com (No trailing slash)`;
    }
  } catch (_) {
    return `Please use a valid domain name. e.g. https://domain.com`;
  }
};

export const checkEventIsFromParent = (
  event: MessageEvent,
  actionPayload: TWindowMessageListenerDescription["payload"],
) => {
  if (event.source !== window.parent) return false;
  if (event.type !== "message") return false;
  if (event.origin !== actionPayload.acceptedOrigin) return false;

  return true;
};

export const getEventListener = (
  actionPayload: TWindowMessageListenerDescription["payload"],
  messageChannel: Channel<MessageChannelPayload>,
  eventType: EventType,
  triggerMeta: TriggerMeta,
) => {
  return (event: MessageEvent) => {
    if (!checkEventIsFromParent(event, actionPayload)) return;

    messageChannel.put({
      callbackString: actionPayload.callbackString,
      callbackData: event.data,
      eventType,
      triggerMeta,
    });
  };
};
