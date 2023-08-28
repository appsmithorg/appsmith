// Workers do not have access to log.error
/* eslint-disable no-console */
import type { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import { syncHandlerMap, asyncHandlerMap } from "./handlers";
import type { TMessage } from "utils/MessageUtil";
import { MessageType } from "utils/MessageUtil";
import { WorkerMessenger } from "./fns/utils/Messenger";
import { EVAL_WORKER_SYNC_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";

const workerBusy: Promise<any>[] = [];

//TODO: Create a more complete RPC setup in the subtree-eval branch.
async function syncRequestMessageListener(
  e: MessageEvent<TMessage<EvalWorkerSyncRequest>>,
) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const startTime = performance.now();
  const { body, messageId } = e.data;
  const { method } = body;
  if (!method) return;
  await Promise.allSettled(workerBusy);
  let workerBusyResolve: any;
  if (method === EVAL_WORKER_SYNC_ACTION.EVAL_TREE) {
    workerBusy.push(new Promise((resolve) => (workerBusyResolve = resolve)));
  }
  const messageHandler = syncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = await messageHandler(body);
  if (!responseData) return;
  const endTime = performance.now();
  WorkerMessenger.respond(messageId, responseData, endTime - startTime);
  if (workerBusyResolve) workerBusyResolve(true);
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
