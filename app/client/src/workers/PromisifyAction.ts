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
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";
import _ from "lodash";
import { dataTreeEvaluator } from "workers/evaluation.worker";
import { RequestOrigin } from "utils/WorkerUtil";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";

export const talkToMainThread = (
  actionDescription: ActionDescription,
  eventType?: EventType,
  triggerMeta?: TriggerMeta,
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
  if (self.dryRun) {
    self.dryRun = false;
    return Promise.resolve(true);
  }
  const requestId = _.uniqueId(`${actionDescription.type}_`);
  return new Promise((resolve, reject) => {
    const handler = handleResponseFromMainThread(requestId, resolve, reject);
    ctx.addEventListener("message", handler);
    ctx.postMessage({
      requestId,
      requestOrigin: RequestOrigin.Worker,
      data: {
        trigger: actionDescription,
        errors: [],
        eventType,
        triggerMeta,
      },
    });
  });
};

export const promisifyAction = (
  workerRequestId: string,
  actionDescription: ActionDescription,
  eventType?: EventType,
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
      eventType,
    };
    ctx.postMessage({
      type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
      responseData,
      requestId: workerRequestIdCopy,
      promisified: true,
    });
    const processResponse = function(event: MessageEvent) {
      const { data, eventType, method, requestId, success } = event.data;
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
          const globalData = createGlobalData({
            dataTree: dataTreeEvaluator.evalTree,
            resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
            isTriggerBased: true,
            context: { eventType },
          });
          for (const entity in globalData) {
            // @ts-expect-error: Types are not available
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
    promisified: true,
  });
};

export const confirmationPromise = function(
  requestId: string,
  func: any,
  name: string,
  ...args: any[]
) {
  const payload: ActionDescription = {
    type: ActionTriggerType.CONFIRMATION_MODAL,
    payload: {
      funName: name,
    },
  };
  return promisifyAction(requestId, payload).then(() => func(...args));
};

function handleResponseFromMainThread(
  requestId: string,
  resolve: any,
  reject: any,
) {
  function responseHandler(event: MessageEvent) {
    const {
      method,
      requestData: { data, eventType, success, triggerMeta },
      requestId: requestIdFromMainThread,
    } = event.data;
    if (method !== EVAL_WORKER_ACTIONS.PROCESS_TRIGGER) return;
    if (requestId !== requestIdFromMainThread) return;
    if (!dataTreeEvaluator) {
      reject("No Data Tree Evaluator found");
      ctx.removeEventListener("message", responseHandler);
      return;
    }
    self.ALLOW_ASYNC = true;
    const globalData = createGlobalData({
      dataTree: dataTreeEvaluator.evalTree,
      resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
      isTriggerBased: true,
      context: {
        eventType,
      },
      triggerMeta,
    });
    Object.assign(self, globalData);
    if (success) {
      resolve.apply(self, data.resolve);
    } else {
      reject(data.reason);
    }
    ctx.removeEventListener("message", responseHandler);
  }
  return responseHandler;
}

export function executeTriggerOnMainThread(
  trigger: ActionDescription,
  eventType?: EventType,
  triggerMeta?: TriggerMeta,
) {
  if (self.dryRun) {
    self.TRIGGER_COLLECTOR.push(trigger);
    self.dryRun = false;
    return;
  }
  ctx.postMessage({
    requestOrigin: RequestOrigin.Worker,
    data: {
      trigger,
      errors: [],
      triggerMeta,
      eventType,
    },
  });
}
