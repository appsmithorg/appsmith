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
          postMessage({
            requestId,
            responseData,
            timeTaken: (endTime - startTime).toFixed(2),
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
          postMessage({
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
  switch (method) {
    case LINT_WORKER_ACTIONS.LINT_TREE: {
      const { pathsToLint, unEvalTree } = requestData as LintTreeRequest;
      const lintTreeResponse: LintTreeResponse = { errors: {} };
      const lintErrors = getlintErrorsFromTree(pathsToLint, unEvalTree);
      lintTreeResponse.errors = lintErrors;
      return lintTreeResponse;
    }

    default: {
      // eslint-disable-next-line no-console
      console.error("Action not registered on worker", method);
    }
  }
}

addEventListener("message", messageEventListener(eventRequestHandler));
