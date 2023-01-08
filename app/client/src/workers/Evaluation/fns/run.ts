import { isTrueObject } from "ce/workers/Evaluation/evaluationUtils";
import { createEvaluationContext } from "../evaluate";
import { MAIN_THREAD_ACTION } from "../evalWorkerActions";
import { dataTreeEvaluator } from "../handlers/evalTree";
import { WorkerMessenger } from "./utils/Messenger";

export default async function run(
  this: any,
  onSuccessOrParams?: (data: any) => unknown | Record<string, unknown>,
  onError?: () => unknown,
  params = {},
) {
  const actionParams = isTrueObject(onSuccessOrParams)
    ? onSuccessOrParams
    : params;

  const response: any = await WorkerMessenger.request({
    method: MAIN_THREAD_ACTION.PROCESS_TRIGGER,
    data: {
      trigger: {
        type: "RUN_PLUGIN_ACTION",
        payload: {
          actionId: this.actionId,
          params: actionParams,
        },
      },
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
    if (typeof onError === "function") {
      onError();
      return;
    }
    throw new Error(data.reason);
  }

  if (typeof onSuccessOrParams === "function") onSuccessOrParams(data.resolve);

  return data.resolve;
}
