import {
  createEvaluationContext,
  setupMetadata,
} from "workers/Evaluation/evaluate";
import { ActionDescription } from "@appsmith/entities/DataTree/actionTriggers";
import { dataTreeEvaluator } from "../../handlers/evalTree";
import { MAIN_THREAD_ACTION } from "ce/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "./Messenger";

export async function promisifyAction(
  actionDescription: ActionDescription,
  metaData: typeof self["$metaData"],
): Promise<any> {
  const response: any = await WorkerMessenger.request({
    method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
    data: {
      trigger: actionDescription,
      metaData,
    },
  });
  const { data: messageData } = response;
  const { data, success } = messageData;
  if (!dataTreeEvaluator) throw new Error("No Data Tree Evaluator found");

  self["$allowAsync"] = true;

  const evalContext = createEvaluationContext({
    dataTree: dataTreeEvaluator.evalTree,
    resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
    isTriggerBased: true,
  });
  Object.assign(self, evalContext);
  setupMetadata(metaData);
  if (!success) {
    throw new Error(data.reason);
  }
  return data.resolve;
}
