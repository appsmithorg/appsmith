import ExecutionMetaData from "./ExecutionMetaData";
import TriggerEmitter, { BatchKey } from "./TriggerEmitter";

/**
 * This function is used to batch the execution of a function
 * @param fnDescriptor The function descriptor
 * @param batchKey The batch key
 * @returns A function that can be used to trigger the batched execution
 *
 */
export function batchedFn<P extends ReadonlyArray<unknown>>(
  fnDescriptor: (...args: P) => { type: string; payload: any },
  batchKey: BatchKey,
) {
  return (...args: P) => {
    const trigger = fnDescriptor(...args);
    const metaData = ExecutionMetaData.getExecutionMetaData();
    TriggerEmitter.emit(batchKey, {
      trigger,
      ...metaData,
    });
  };
}
