import { EventEmitter } from "events";
import { MAIN_THREAD_ACTION } from "workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";
import { _internalClearTimeout, _internalSetTimeout } from "../timeout";

export class TriggerEmitter extends EventEmitter {
  private static instance: TriggerEmitter;
  private constructor() {
    super();
  }
  static getInstance() {
    if (!TriggerEmitter.instance) {
      TriggerEmitter.instance = new TriggerEmitter();
    }
    return TriggerEmitter.instance;
  }
}

/**
 * This function is used to batch actions and send them to the main thread
 * in a single message. This is useful for actions that are called frequently
 * and we don't want to send a message for each action. This function is used
 * for actions that are called in a priority order.
 * @param task
 * @returns
 */
const priorityBatchedActionHandler = function(
  task: (batchedData: unknown) => void,
) {
  const batchedData: unknown[] = [];
  return (data: unknown) => {
    if (batchedData.length === 0) {
      queueMicrotask(() => {
        task(batchedData);
        batchedData.length = 0;
      });
    }
    batchedData.push(data);
  };
};

const triggerEmitter = TriggerEmitter.getInstance();

/**
 * This function is used to batch actions and send them to the main thread
 * in a single message. This is useful for actions that are called frequently
 * and we don't want to send a message for each action.
 * @param deferredTask
 * @returns
 */
const deferredBatchedActionHandler = function(
  deferredTask: (batchedData: unknown) => void,
) {
  const batchedData: unknown[] = [];
  let timerId: number | null = null;
  return (data: unknown) => {
    batchedData.push(data);
    if (timerId) _internalClearTimeout(timerId);
    timerId = _internalSetTimeout(() => {
      deferredTask(batchedData);
      batchedData.length = 0;
    });
  };
};

const logsHandler = deferredBatchedActionHandler((batchedData) =>
  WorkerMessenger.ping({
    method: MAIN_THREAD_ACTION.PROCESS_LOGS,
    data: batchedData,
  }),
);

triggerEmitter.on("process_logs", logsHandler);

const storeUpdatesHandler = priorityBatchedActionHandler((batchedData) =>
  WorkerMessenger.ping({
    method: MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES,
    data: batchedData,
  }),
);

triggerEmitter.on("process_store_updates", storeUpdatesHandler);

const defaultTriggerHandler = priorityBatchedActionHandler((batchedData) =>
  WorkerMessenger.ping({
    method: MAIN_THREAD_ACTION.PROCESS_TRIGGERS,
    data: batchedData,
  }),
);

triggerEmitter.on("process_triggers", defaultTriggerHandler);
