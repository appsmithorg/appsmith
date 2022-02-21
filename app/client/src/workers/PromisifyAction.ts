import { createGlobalData, EvalResult } from "workers/evaluate";
const ctx: Worker = self as any;

/*
 * We wrap all actions with a promise. The promise will send a message to the main thread
 * and wait for a response till it can resolve or reject the promise. This way we can invoke actions
 * in the main thread while evaluating in the main thread. In principle, all actions now work as promises.
 *
 * needs a REQUEST_ID to be passed in to know which request is going on right now
 */
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { ActionDescription } from "entities/DataTree/actionTriggers";
import _ from "lodash";
import { dataTreeEvaluator } from "workers/evaluation.worker";

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
    // send an execution request to the main thread
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
      // This listener will get all the messages that come to the worker
      // we need to find the correct one pertaining to this promise
      if (
        method === EVAL_WORKER_ACTIONS.PROCESS_TRIGGER &&
        requestId === workerRequestIdCopy &&
        subRequestId === event.data.data.subRequestId
      ) {
        // If we get a response for this same promise we will resolve or reject it

        // We could not find a data tree evaluator,
        // maybe the page changed, or we have a cyclical dependency
        if (!dataTreeEvaluator) {
          reject("No Data Tree Evaluator found");
        } else {
          self.ALLOW_ASYNC = true;
          // Reset the global data with the correct request id for this promise
          const globalData = createGlobalData(
            dataTreeEvaluator.evalTree,
            dataTreeEvaluator.resolvedFunctions,
            true,
            {
              requestId: workerRequestId,
            },
          );
          for (const entity in globalData) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            self[entity] = globalData[entity];
          }

          // Resolve or reject the promise
          if (success) {
            resolve.apply(self, data.resolve);
          } else {
            reject(data.reason);
          }
        }
        // we are done with this particular promise so remove the event listener
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
