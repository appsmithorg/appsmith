import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { AddMessageHandlerDescription } from "entities/DataTree/actionTriggers";
import { Channel, channel } from "redux-saga";
import { call, take, spawn } from "redux-saga/effects";
import { executeAppAction, TriggerMeta } from "./ActionExecutionSagas";

interface MessageChannelPayload {
  callback: string;
  callbackData: unknown;
  eventType: EventType;
  triggerMeta: TriggerMeta;
}

export function* addMessageHandlerSaga(
  actionPayload: AddMessageHandlerDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const messageChannel = channel<MessageChannelPayload>();
  yield spawn(messageChannelHandler, messageChannel);

  const messageHandler = (event: MessageEvent) => {
    if (event.currentTarget !== window) return;
    if (event.type !== "message") return;
    if (!isValidDomain(event.origin)) return;

    messageChannel.put({
      callback: actionPayload.callback,
      callbackData: event.data,
      eventType,
      triggerMeta,
    });
  };

  window.addEventListener("message", messageHandler);
}

function* messageChannelHandler(channel: Channel<MessageChannelPayload>) {
  try {
    while (true) {
      const payload: MessageChannelPayload = yield take(channel);
      const { callback, callbackData, eventType, triggerMeta } = payload;
      yield call(executeAppAction, {
        dynamicString: callback,
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

function isValidDomain(domain: string): boolean {
  if (
    domain == "http://localhost:3001" ||
    domain.indexOf("manabie.net") > -1 ||
    domain.indexOf("web.app") > -1 ||
    domain.indexOf("manabie.io") > -1
  ) {
    return true;
  }
  return false;
}
