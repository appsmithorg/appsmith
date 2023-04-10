export * from "ce/workers/Evaluation/JSObject/postJSFunctionExecution";

import TriggerEmitter, {
  BatchKey,
} from "workers/Evaluation/fns/utils/TriggerEmitter";

export function postJSFunctionExecutionLog(fullName: string) {
  TriggerEmitter.emit(BatchKey.process_batched_fn_invoke_log, fullName);
}
