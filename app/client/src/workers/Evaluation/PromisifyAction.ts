import { createGlobalData } from "workers/Evaluation/evaluate";
const ctx: Worker = self as any;

/*
 * We wrap all actions with a promise. The promise will send a message to the main thread
 * and wait for a response till it can resolve or reject the promise. This way we can invoke actions
 * in the main thread while evaluating in the main thread. In principle, all actions now work as promises.
 *
 * needs a REQUEST_ID to be passed in to know which request is going on right now
 */
import { ActionDescription } from "@appsmith/entities/DataTree/actionTriggers";
import _ from "lodash";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { dataTreeEvaluator } from "./handlers/evalTree";
import { TMessage, sendMessage, MessageType } from "utils/MessageUtil";
import { MAIN_THREAD_ACTION } from "./evalWorkerActions";

export const promisifyAction = (
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
  return new Promise((resolve, reject) => {
    // We create a new sub request id for each request going on so that we can resolve the correct one later on
    const messageId = _.uniqueId(`${actionDescription.type}_`);
    // send an execution request to the main thread
    const data = {
      trigger: actionDescription,
      eventType,
    };
    sendMessage.call(ctx, {
      messageId,
      messageType: MessageType.REQUEST,
      body: {
        method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
        data,
      },
    });
    const processResponse = function(event: MessageEvent<TMessage<any>>) {
      const { messageType } = event.data;
      if (messageType !== MessageType.RESPONSE) return;
      const { body, messageId: resMessageId } = event.data;
      const { data: messageData } = body;
      const { data, eventType, success } = messageData;
      // This listener will get all the messages that come to the worker
      // we need to find the correct one pertaining to this promise
      if (resMessageId === messageId && messageType === MessageType.RESPONSE) {
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
            context: {
              eventType,
            },
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
