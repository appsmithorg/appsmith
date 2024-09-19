import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import { dataTreeEvaluator } from "workers/Evaluation/handlers/evalTree";
import ExecutionMetaData from "./ExecutionMetaData";
import { WorkerMessenger } from "./Messenger";

/**
 * This function is used to promisify the execution of a function
 * @param fnDescriptor The function descriptor
 * @returns A function that can be used to trigger the execution
 */
export function promisify<P extends ReadonlyArray<unknown>>(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    if (!dataTreeEvaluator) throw new Error("No data tree evaluator found");

    ExecutionMetaData.setExecutionMetaData(metaData);
    self["$isDataField"] = false;
    const { data, error } = response;

    if (error) {
      throw error;
    }

    return data;
  };
}
