import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerASyncRequest } from "../types";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";

export default async function (request: EvalWorkerASyncRequest) {
  const { data } = request;
  const {
    callbackData,
    dynamicTrigger,
    eventType,
    globalContext,
    triggerMeta,
    unEvalTree,
  } = data;
  if (!dataTreeEvaluator) {
    return { triggers: [], errors: [] };
  }

  ExecutionMetaData.setExecutionMetaData({ triggerMeta, eventType });

  const { evalOrder, unEvalUpdates } = dataTreeEvaluator.setupUpdateTree(
    unEvalTree.unEvalTree,
    unEvalTree.configTree,
  );

  const { contextTree } = dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    unEvalTree.configTree,
    unEvalUpdates,
  );

  return dataTreeEvaluator.evaluateTriggers(
    dynamicTrigger,
    contextTree,
    unEvalTree.configTree,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
