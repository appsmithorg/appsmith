import type { TDefaultMessage } from "utils/MessageUtil";
import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";
import TriggerEmitter, {
  BatchKey,
} from "workers/Evaluation/fns/utils/TriggerEmitter";
import {
  validateUnlistenWindowMessageOrigin,
  validateWindowMessageListenerOrigin,
} from "./validations";

export const __listenersMap__ = new Map<
  string,
  {
    unListen: () => void;
  }
>();

function windowMessageListenerDescriptor(
  this: any,
  // origin check and callback execution doesn't happen on main thread
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  origin: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callback: (...args: any[]) => any,
) {
  return {
    type: "WINDOW_MESSAGE_LISTENER" as const,
    payload: {
      windowMessageListenerId: this.windowMessageListenerId,
      clearAllWindowMessageListenerId: this.clearAllWindowMessageListenerId,
    },
  };
}

function unlistenWindowMessageDescriptor(
  // origin check doesn't happen on main thread
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  origin: string,
) {
  return {
    type: "UNLISTEN_WINDOW_MESSAGE" as const,
    payload: {},
  };
}

export const windowMessageListenerId = "windowMessageListener";

export const clearAllWindowMessageListenerId = "clearAllWindowMessages";
export let _clearAllCallback: ((e: MessageEvent<any>) => void) | undefined =
  undefined;

export type TWindowMessageListenerArgs = Parameters<
  typeof windowMessageListenerDescriptor
>;
export type TWindowMessageListenerDescription = ReturnType<
  typeof windowMessageListenerDescriptor
>;
export type TWindowMessageListenerType =
  TWindowMessageListenerDescription["type"];

export type TUnlistenWindowMessageArgs = Parameters<
  typeof unlistenWindowMessageDescriptor
>;
export type TUnlistenWindowMessageDescription = ReturnType<
  typeof unlistenWindowMessageDescriptor
>;
export type TUnlistenWindowMessageType =
  TUnlistenWindowMessageDescription["type"];

export function windowMessageListener(...args: TWindowMessageListenerArgs) {
  const metaData = ExecutionMetaData.getExecutionMetaData();

  const [origin, callback] = args;

  if (!validateWindowMessageListenerOrigin(origin, __listenersMap__)) return;

  if (!_clearAllCallback) {
    const clearAllCallback = (event: MessageEvent<TDefaultMessage<any>>) => {
      const message = event.data;
      if (message.messageId !== clearAllWindowMessageListenerId) return;
      clearAllWindowMessageListeners();
    };
    self.addEventListener("message", clearAllCallback);
    _clearAllCallback = clearAllCallback;
  }

  TriggerEmitter.emit(BatchKey.process_batched_triggers, {
    trigger: windowMessageListenerDescriptor.apply(
      {
        windowMessageListenerId,
        clearAllWindowMessageListenerId,
      },
      args,
    ),
    ...metaData,
  });

  const messageHandler = (event: MessageEvent<TDefaultMessage<any>>) => {
    const message = event.data;
    const { body } = message;
    if (message.messageId !== windowMessageListenerId || body.origin !== origin)
      return;
    ExecutionMetaData.setExecutionMetaData({
      triggerMeta: metaData.triggerMeta,
      eventType: metaData.eventType,
    });
    typeof callback === "function" && callback(body.data);
  };
  self.addEventListener("message", messageHandler);

  __listenersMap__.set(origin, {
    unListen: () => self.removeEventListener("message", messageHandler),
  });
}

export function unlistenWindowMessage(...args: TUnlistenWindowMessageArgs) {
  const [origin] = args;

  if (!validateUnlistenWindowMessageOrigin(origin, __listenersMap__)) return;

  const listener = __listenersMap__.get(origin);
  if (listener) {
    listener.unListen();
    __listenersMap__.delete(origin);

    if (__listenersMap__.size === 0) {
      const metaData = ExecutionMetaData.getExecutionMetaData();
      TriggerEmitter.emit(BatchKey.process_batched_triggers, {
        trigger: unlistenWindowMessageDescriptor(...args),
        ...metaData,
      });
      unassignClearAllCallback();
    }
  }
}

export function clearAllWindowMessageListeners() {
  for (const [, listener] of __listenersMap__) {
    listener.unListen();
  }
  __listenersMap__.clear();

  TriggerEmitter.emit(BatchKey.process_batched_triggers, {
    trigger: unlistenWindowMessageDescriptor(origin),
  });

  unassignClearAllCallback();
}

function unassignClearAllCallback() {
  if (_clearAllCallback) {
    self.removeEventListener("message", _clearAllCallback);
    _clearAllCallback = undefined;
  }
}
