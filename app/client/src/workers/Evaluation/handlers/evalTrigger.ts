import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerASyncRequest } from "../types";
import { createUnEvalTreeForEval } from "@appsmith/workers/Evaluation/dataTreeUtils";

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
  // const unEvalTree = createUnEvalTreeForEval(__unEvalTree__);
  const unEvalTree = __unEvalTree__;
  const {
    evalOrder,
    nonDynamicFieldValidationOrder,
  } = dataTreeEvaluator.setupUpdateTree(
    unEvalTree.dataTree,
    unEvalTree.configTree,
  );
  dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    nonDynamicFieldValidationOrder,
    unEvalTree.configTree,
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
