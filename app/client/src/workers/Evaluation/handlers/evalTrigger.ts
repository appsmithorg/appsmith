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

  ExecutionMetaData.setExecutionMetaData(triggerMeta, eventType);
  const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
    dataTreeEvaluator.setupUpdateTree(
      unEvalTree.unEvalTree,
      unEvalTree.configTree,
    );
  dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    nonDynamicFieldValidationOrder,
    unEvalTree.configTree,
    unEvalUpdates,
  );
  const evalTree = dataTreeEvaluator.evalTree;
  const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

  return dataTreeEvaluator.evaluateTriggers(
    dynamicTrigger,
    evalTree,
    resolvedFunctions,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
