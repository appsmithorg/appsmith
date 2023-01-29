import { EventEmitter } from "events";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";

const _internalSetTimeout = self.setTimeout;
const _internalClearTimeout = self.clearTimeout;

export enum BatchKey {
  process_logs = "process_logs",
  process_store_updates = "process_store_updates",
  process_batched_triggers = "process_batched_triggers",
}

const TriggerEmitter = new EventEmitter();
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

TriggerEmitter.on(BatchKey.process_logs, logsHandler);

const storeUpdatesHandler = priorityBatchedActionHandler((batchedData) =>
  WorkerMessenger.ping({
    method: MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES,
    data: batchedData,
  }),
);

TriggerEmitter.on(BatchKey.process_store_updates, storeUpdatesHandler);

const defaultTriggerHandler = priorityBatchedActionHandler((batchedData) =>
  WorkerMessenger.ping({
    method: MAIN_THREAD_ACTION.PROCESS_BATCHED_TRIGGERS,
    data: batchedData,
  }),
);

TriggerEmitter.on(BatchKey.process_batched_triggers, defaultTriggerHandler);

export default TriggerEmitter;
