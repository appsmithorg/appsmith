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
  const regex1 = new RegExp("/(.+?)[.]manabie.com$");
  const regex2 = new RegExp("/(.+?)[.]web.app$");
  const regex3 = new RegExp("/(.+?)[.]manabie.io$");
  if (
    (window.location.origin == "http://localhost" ||
      regex3.test(window.location.origin)) &&
    domain.indexOf("localhost") > -1
  ) {
    return true;
  }

  if (regex1.test(domain) || regex2.test(domain) || regex3.test(domain)) {
    return true;
  }
  return false;
}
