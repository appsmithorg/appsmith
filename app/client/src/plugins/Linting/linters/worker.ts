import type { TMessage } from "utils/MessageUtil";
import { MessageType } from "utils/MessageUtil";
import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";
import type { LintRequest } from "../types";
import { handlerMap } from "../handlers";

export function messageListener(e: MessageEvent<TMessage<LintRequest>>) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const startTime = performance.now();
  const { body, messageId } = e.data;
  const { data, method } = body;
  if (!method) return;
  const messageHandler = handlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = messageHandler(data);
  if (!responseData) return;
  const endTime = performance.now();
  WorkerMessenger.respond(messageId, responseData, endTime - startTime);
}

self.onmessage = messageListener;
