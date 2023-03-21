export * from "ce/workers/Evaluation/JSObject/postJSFunctionExecution";

import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";
import TriggerEmitter, {
  priorityBatchedActionHandler,
} from "workers/Evaluation/fns/utils/TriggerEmitter";

const process_batched_fn_invoke_log = "process_batched_fn_invoke_log";

import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";

const fnInvokeLogHandler = priorityBatchedActionHandler((data) => {
  WorkerMessenger.ping({
    method: MAIN_THREAD_ACTION.LOG_JS_FUNCTION_EXECUTION,
    data,
  });
});

TriggerEmitter.on(process_batched_fn_invoke_log, fnInvokeLogHandler);

export function postJSFunctionExecutionLog(fullName: string) {
  TriggerEmitter.emit(process_batched_fn_invoke_log, fullName);
}
