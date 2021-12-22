import { EvalResult } from "workers/evaluate";
const ctx: Worker = self as any;

/*
 * We wrap all actions with a promise. The promise will send a message to the main thread
 * and wait for a response till it can resolve or reject the promise. This way we can invoke actions
 * in the main thread while evaluating in the main thread. In principle, all actions now work as promises.
 *
 * needs a REQUEST_ID on global scope to know which request is going on right now
 */
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { ActionDescription } from "entities/DataTree/actionTriggers";
import _ from "lodash";
import { updateRequestIdsOfFunctions } from "workers/Actions";

export const promisifyAction = (
  workerRequestId: string,
  actionDescription: ActionDescription,
) => {
  if (!self.ALLOW_ASYNC) {
    /**
     * To figure out if any function (JS action) is async, we do a dry run so that we can know if the function
     * is using an async action. We set an IS_ASYNC flag to later indicate that a promise was called.
     * @link isFunctionAsync
     * */
    self.IS_ASYNC = true;
    throw new Error("Async function called in a sync field");
  }
  const workerRequestIdCopy = workerRequestId.concat("");
  return new Promise((resolve, reject) => {
    // We create a new sub request id for each request going on so that we can resolve the correct one later on
    const subRequestId = _.uniqueId(`${workerRequestIdCopy}_`);
    const responseData = {
      trigger: actionDescription,
      errors: [],
      subRequestId,
    };
    ctx.postMessage({
      type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
      responseData,
      requestId: workerRequestIdCopy,
    });
    const processResponse = function(event: MessageEvent) {
      const { data, method, requestId, success } = event.data;
      if (
        method === EVAL_WORKER_ACTIONS.PROCESS_TRIGGER &&
        requestId === workerRequestIdCopy &&
        subRequestId === event.data.data.subRequestId
      ) {
        // If we get a response for this same promise we will resolve or reject it

        self.ALLOW_ASYNC = true;
        updateRequestIdsOfFunctions(workerRequestId);

        if (success) {
          resolve.apply(self, data.resolve);
        } else {
          reject(data.reason);
        }
        ctx.removeEventListener("message", processResponse);
      }
    };
    ctx.addEventListener("message", processResponse);
  });
};
// To indicate the main thread that the processing of the trigger is done
// we send a finished message
export const completePromise = (requestId: string, result: EvalResult) => {
  ctx.postMessage({
    type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
    responseData: {
      finished: true,
      result,
    },
    requestId,
  });
};
