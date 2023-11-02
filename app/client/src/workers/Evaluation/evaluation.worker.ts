// Workers do not have access to log.error
/* eslint-disable no-console */
import type { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import {
  syncHandlerMap,
  asyncHandlerMap,
  transmissionErrorHandlerMap,
} from "./handlers";
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
  const transmissionErrorHandler = transmissionErrorHandlerMap[method];
  const endTime = performance.now();
  WorkerMessenger.respond(
    messageId,
    responseData,
    endTime - startTime,
    transmissionErrorHandler,
  );
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
  const transmissionErrorHandler = transmissionErrorHandlerMap[method];
  WorkerMessenger.respond(
    messageId,
    data,
    end - start,
    transmissionErrorHandler,
  );
}

self.addEventListener("message", syncRequestMessageListener);
self.addEventListener("message", asyncRequestMessageListener);

self.addEventListener("error", (e) => {
  e.preventDefault();
  console.error(e.message);
});

self.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
  // We might want to send this error to the main thread in the future.
  // console error will log the error to the logs tab against trigger field.
  console.error(e.reason.message);
});
