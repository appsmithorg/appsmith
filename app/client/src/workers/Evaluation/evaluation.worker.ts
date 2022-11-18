// Workers do not have access to log.error
/* eslint-disable no-console */
import { WorkerErrorTypes } from "workers/common/types";
import { EvalWorkerRequest } from "./types";
import handlerMap from "./handlers";

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(e: MessageEvent<EvalWorkerRequest>) {
  const startTime = performance.now();
  const { method, requestData, requestId } = e.data;
  if (!method) return;
  const responseData = handlerMap[method](e.data);
  const endTime = performance.now();
  try {
    self.postMessage({
      requestId,
      responseData,
      timeTaken: (endTime - startTime).toFixed(2),
    });
  } catch (e) {
    console.error(e);
    // we don't want to log dataTree because it is huge.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dataTree, ...rest } = requestData;
    self.postMessage({
      requestId,
      responseData: {
        errors: [
          {
            type: WorkerErrorTypes.CLONE_ERROR,
            message: (e as Error)?.message,
            context: JSON.stringify(rest),
          },
        ],
      },
      timeTaken: (endTime - startTime).toFixed(2),
    });
  }
}

self.onmessage = messageEventListener;
