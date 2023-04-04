// Workers do not have access to log.error
/* eslint-disable no-console */
import type { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import { syncHandlerMap, asyncHandlerMap } from "./handlers";
import type { TMessage } from "utils/MessageUtil";
import { MessageType } from "utils/MessageUtil";
import { WorkerMessenger } from "./fns/utils/Messenger";

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function syncRequestMessageListener(
  e: MessageEvent<TMessage<EvalWorkerSyncRequest>>,
) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const startTime = performance.now();
  const { body, messageId } = e.data;
  const { method } = body;
  if (!method) return;
  const messageHandler = syncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = messageHandler(body);
  if (!responseData) return;
  const endTime = performance.now();
  WorkerMessenger.respond(messageId, responseData, endTime - startTime);
}

async function asyncRequestMessageListener(
  e: MessageEvent<TMessage<EvalWorkerASyncRequest>>,
) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const start = performance.now();
  const { body, messageId } = e.data;
  const { method } = body;
  if (!method) return;
  const messageHandler = asyncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const data = await messageHandler(body);
  if (!data) return;
  const end = performance.now();
  WorkerMessenger.respond(messageId, data, end - start);
}

self.addEventListener("message", syncRequestMessageListener);
self.addEventListener("message", asyncRequestMessageListener);
