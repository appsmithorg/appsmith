import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { ActionDescription } from "@appsmith/entities/DataTree/actionTriggers";
import { dataTreeEvaluator } from "../../handlers/evalTree";
import { MAIN_THREAD_ACTION } from "ce/workers/Evaluation/evalWorkerActions";
import { WorkerMessenger } from "./Messenger";
import { TriggerMeta } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import ExecutionMetaData from "./ExecutionMetaData";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

export async function promisifyAction(
  actionDescription: ActionDescription,
  metaData: { triggerMeta?: TriggerMeta; eventType?: EventType },
): Promise<any> {
  const response: any = await WorkerMessenger.request({
    method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
    data: {
      trigger: actionDescription,
      ...metaData,
    },
  });
  const { data: messageData } = response;
  const { data, success } = messageData;
  if (!dataTreeEvaluator) throw new Error("No Data Tree Evaluator found");

  ExecutionMetaData.setExecutionMetaData(
    metaData.triggerMeta,
    metaData.eventType,
  );
  self["$allowAsync"] = true;

  const evalContext = createEvaluationContext({
    dataTree: dataTreeEvaluator.evalTree,
    resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
    isTriggerBased: true,
  });
  Object.assign(self, evalContext);
  if (!success) {
    throw new Error(data.reason);
  }
  return data.resolve;
}
