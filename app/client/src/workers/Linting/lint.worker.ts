import { WorkerErrorTypes } from "workers/common/types";
import {
  LintWorkerRequest,
  LintTreeResponse,
  LINT_WORKER_ACTIONS,
  LintTreeRequest,
} from "./types";
import { getlintErrorsFromTree } from "./utils";

function messageEventListener(fn: typeof eventRequestHandler) {
  return (event: MessageEvent<LintWorkerRequest>) => {
    const startTime = performance.now();
    const { method, requestId } = event.data;
    if (method) {
      const responseData = fn(event.data);
      if (responseData) {
        const endTime = performance.now();
        try {
          self.postMessage({
            requestId,
            responseData,
            timeTaken: (endTime - startTime).toFixed(2),
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
          self.postMessage({
            requestId,
            responseData: {
              errors: [
                {
                  type: WorkerErrorTypes.CLONE_ERROR,
                  message: (e as Error)?.message,
                },
              ],
            },
            timeTaken: (endTime - startTime).toFixed(2),
          });
        }
      }
    }
  };
}

function eventRequestHandler({
  method,
  requestData,
}: LintWorkerRequest): LintTreeResponse | unknown {
  debugger;
  switch (method) {
    case LINT_WORKER_ACTIONS.LINT_TREE: {
      const lintTreeResponse: LintTreeResponse = { errors: {} };
      try {
        const { pathsToLint, unevalTree } = requestData as LintTreeRequest;
        const lintErrors = getlintErrorsFromTree(pathsToLint, unevalTree);
        lintTreeResponse.errors = lintErrors;
      } catch (e) {}
      return lintTreeResponse;
    }

    default: {
      // eslint-disable-next-line no-console
      console.error("Action not registered on lintWorker ", method);
    }
  }
}

addEventListener("message", messageEventListener(eventRequestHandler));
