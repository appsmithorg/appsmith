import TriggerEmitter, {
  BatchKey,
} from "workers/Evaluation/fns/utils/TriggerEmitter";
import type { PostProcessorArg } from "workers/Evaluation/fns/utils/jsObjectFnFactory";

export function postJSFunctionExecutionLog({
  executionMetaData,
  isSuccess,
  jsFnFullName,
}: PostProcessorArg) {
  TriggerEmitter.emit(BatchKey.process_batched_fn_invoke_log, {
    jsFnFullName,
    isSuccess,
    triggerMeta: executionMetaData.triggerMeta,
  });
}
