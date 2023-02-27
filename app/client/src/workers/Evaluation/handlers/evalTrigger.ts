import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerASyncRequest } from "../types";
import { createUnEvalTreeForEval } from "@appsmith/workers/Evaluation/dataTreeUtils";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";

export default async function(request: EvalWorkerASyncRequest) {
  const { data } = request;
  const {
    callbackData,
    dynamicTrigger,
    eventType,
    globalContext,
    triggerMeta,
    unEvalTree: __unEvalTree__,
  } = data;
  if (!dataTreeEvaluator) {
    return { triggers: [], errors: [] };
  }
  ExecutionMetaData.setExecutionMetaData(triggerMeta, eventType);
  const unEvalTree = createUnEvalTreeForEval(__unEvalTree__);
  const {
    evalOrder,
    nonDynamicFieldValidationOrder,
    unEvalUpdates,
  } = dataTreeEvaluator.setupUpdateTree(unEvalTree);
  dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    nonDynamicFieldValidationOrder,
    unEvalUpdates,
  );
  const evalTree = dataTreeEvaluator.evalTree;

  return dataTreeEvaluator.evaluateTriggers(
    dynamicTrigger,
    evalTree,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
