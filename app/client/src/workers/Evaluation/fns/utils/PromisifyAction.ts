import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { ActionDescription } from "@appsmith/entities/DataTree/actionTriggers";
import _ from "lodash";
import { dataTreeEvaluator } from "../../handlers/evalTree";
import { MAIN_THREAD_ACTION } from "../../evalWorkerActions";
import { WorkerMessenger } from "./Messenger";

export async function promisifyAction(
  actionDescription: ActionDescription,
): Promise<any> {
  const response: any = await WorkerMessenger.request({
    method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
    data: {
      trigger: actionDescription,
      eventType: self["$eventType"],
    },
  });
  const { data: messageData } = response;
  const { data, eventType, success } = messageData;
  if (!dataTreeEvaluator) throw new Error("No Data Tree Evaluator found");
  self["$allowAsync"] = true;
  const evalContext = createEvaluationContext({
    dataTree: dataTreeEvaluator.evalTree,
    resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
    isTriggerBased: true,
    context: {
      eventType,
    },
  });
  Object.assign(self, evalContext);
  if (!success) {
    throw new Error(data.reason);
  }
  return data.resolve;
}
