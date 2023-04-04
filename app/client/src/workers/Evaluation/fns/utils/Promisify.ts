import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { dataTreeEvaluator } from "workers/Evaluation/handlers/evalTree";
import ExecutionMetaData from "./ExecutionMetaData";
import { WorkerMessenger } from "./Messenger";

/**
 * This function is used to promisify the execution of a function
 * @param fnDescriptor The function descriptor
 * @returns A function that can be used to trigger the execution
 */
export function promisify<P extends ReadonlyArray<unknown>>(
  fnDescriptor: (...params: P) => { type: string; payload: any },
) {
  return async function (...args: P) {
    const actionDescription = fnDescriptor(...args);
    const metaData = ExecutionMetaData.getExecutionMetaData();
    const response = await WorkerMessenger.request({
      method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
      data: {
        trigger: actionDescription,
        ...metaData,
      },
    });
    if (!dataTreeEvaluator) throw new Error("No Data Tree Evaluator found");
    ExecutionMetaData.setExecutionMetaData(
      metaData.triggerMeta,
      metaData.eventType,
    );
    self["$isDataField"] = false;
    const evalContext = createEvaluationContext({
      dataTree: dataTreeEvaluator.evalTree,
      resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
      isTriggerBased: true,
    });
    Object.assign(self, evalContext);
    const { data, error } = response;
    if (error) {
      throw error;
    }
    return data;
  };
}
