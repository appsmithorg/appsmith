import type { TMessage } from "utils/MessageUtil";
import { MessageType } from "utils/MessageUtil";
import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";

import { handlerMap } from "../handlers";
import type { LintRequest } from "../types";

export function messageListener(e: MessageEvent<TMessage<LintRequest>>) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const startTime = Date.now();
  const { body, messageId } = e.data;
  const { data, method } = body;
  if (!method) return;
  const messageHandler = handlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = messageHandler(data);
  if (!responseData) return;
  const endTime = Date.now();
  WorkerMessenger.respond(messageId, responseData, startTime, endTime);
}

self.onmessage = messageListener;
