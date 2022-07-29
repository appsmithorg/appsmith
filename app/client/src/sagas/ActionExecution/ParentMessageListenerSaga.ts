import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  SubscribeParentDescription,
  UnsubscribeParentDescription,
} from "entities/DataTree/actionTriggers";
import { Channel, channel, Task } from "redux-saga";
import { call, take, spawn, cancel } from "redux-saga/effects";
import { executeAppAction, TriggerMeta } from "./ActionExecutionSagas";
import { logActionExecutionError } from "./errorUtils";

interface MessageChannelPayload {
  callbackString: string;
  callbackData: unknown;
  eventType: EventType;
  triggerMeta: TriggerMeta;
}

const subscriptionsMap = new Map<
  string,
  {
    // messageChannel: Channel<MessageChannelPayload>;
    windowListenerUnSubscribe: () => void;
    spawnedTask: Task;
    triggerMeta: TriggerMeta;
  }
>();

function* messageChannelHandler(channel: Channel<MessageChannelPayload>) {
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
    console.log("------------- cancelled task");
    channel.close();
  }
}

export function* listenToParentMessages(
  actionPayload: SubscribeParentDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  console.log("------------- Parent listener called");
  const existingSubscription = subscriptionsMap.get(
    actionPayload.acceptedOrigin,
  );
  if (existingSubscription) {
    logActionExecutionError(
      `Already listening to ${actionPayload.acceptedOrigin}. 
      ${existingSubscription.triggerMeta.source} -> ${existingSubscription.triggerMeta.triggerPropertyName}`,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
    return;
  }

  const messageChannel = channel<MessageChannelPayload>();
  const spawnedTask: Task = yield spawn(messageChannelHandler, messageChannel);

  const messageHandler = (event: MessageEvent) => {
    if (event.currentTarget !== window) return;
    if (event.type !== "message") return;
    if (event.origin !== actionPayload.acceptedOrigin) return;

    messageChannel.put({
      callbackString: actionPayload.callbackString,
      callbackData: event.data,
      eventType,
      triggerMeta,
    });
  };

  window.addEventListener("message", messageHandler);

  subscriptionsMap.set(actionPayload.acceptedOrigin, {
    // messageChannel,
    windowListenerUnSubscribe: () =>
      window.removeEventListener("message", messageHandler),
    spawnedTask,
    triggerMeta,
  });
}

export function* unsubscribeParentMessages(
  actionPayload: UnsubscribeParentDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  const existingSubscription = subscriptionsMap.get(actionPayload.origin);
  if (!existingSubscription) {
    logActionExecutionError(
      `No subcriptions to ${actionPayload.origin}`,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
    return;
  }

  existingSubscription.windowListenerUnSubscribe();
  // existingSubscription.messageChannel.close();
  yield cancel(existingSubscription.spawnedTask);
  subscriptionsMap.delete(actionPayload.origin);
}
