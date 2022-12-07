// Workers do not have access to log.error
/* eslint-disable no-console */
import { WorkerErrorTypes } from "workers/common/types";
import { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import { syncHandlerMap, asyncHandlerMap } from "./handlers";

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function syncRequestMessageListener(e: MessageEvent<EvalWorkerSyncRequest>) {
  const startTime = performance.now();
  const { method, requestId } = e.data;
  if (!method) return;
  const messageHandler = syncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = messageHandler(e.data);
  if (!responseData) return;
  const endTime = performance.now();
  respond(requestId, responseData, endTime - startTime);
}

async function asyncRequestMessageListener(
  e: MessageEvent<EvalWorkerASyncRequest>,
) {
  const start = performance.now();
  const { method, requestId } = e.data;
  if (!method) return;
  const messageHandler = asyncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = await messageHandler(e.data);
  if (!responseData) return;
  const end = performance.now();
  respond(requestId, responseData, end - start);
}

function respond(requestId: string, responseData: unknown, timeTaken: number) {
  try {
    self.postMessage({
      requestId,
      responseData,
      timeTaken: timeTaken.toFixed(2),
    });
  } catch (e) {
    console.error(e);
    self.postMessage({
      requestId,
      responseData: {
        errors: [
          {
            type: WorkerErrorTypes.CLONE_ERROR,
            message: (e as Error)?.message,
            context: JSON.stringify(responseData),
          },
        ],
      },
      timeTaken: timeTaken.toFixed(2),
    });
  }
}

self.addEventListener("message", syncRequestMessageListener);
self.addEventListener("message", asyncRequestMessageListener);
