// Workers do not have access to log.error
/* eslint-disable no-console */
import { WorkerErrorTypes } from "workers/common/types";
import { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import { syncHandlerMap, asyncHandlerMap } from "./handlers";
import { MessageType } from "utils/WorkerUtil";

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function syncRequestMessageListener(e: MessageEvent<EvalWorkerSyncRequest>) {
  const startTime = performance.now();
  const { id, method } = e.data;
  if (!method) return;
  const messageHandler = syncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = messageHandler(e.data);
  if (!responseData) return;
  const endTime = performance.now();
  respond(id, responseData, endTime - startTime);
}

async function asyncRequestMessageListener(
  e: MessageEvent<EvalWorkerASyncRequest>,
) {
  const start = performance.now();
  const { id, method } = e.data;
  if (!method) return;
  const messageHandler = asyncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const data = await messageHandler(e.data);
  if (!data) return;
  const end = performance.now();
  respond(id, data, end - start);
}

function respond(id: string, data: unknown, timeTaken: number) {
  try {
    self.postMessage({
      id,
      data,
      messageType: MessageType.RESPONSE,
      timeTaken: timeTaken.toFixed(2),
    });
  } catch (e) {
    console.error(e);
    self.postMessage({
      id,
      data: {
        errors: [
          {
            type: WorkerErrorTypes.CLONE_ERROR,
            message: (e as Error)?.message,
            context: JSON.stringify(data),
          },
        ],
      },
      messageType: MessageType.RESPONSE,
      timeTaken: timeTaken.toFixed(2),
    });
  }
}

self.addEventListener("message", syncRequestMessageListener);
self.addEventListener("message", asyncRequestMessageListener);
