import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerASyncRequest } from "../types";
import { createUnEvalTreeForEval } from "../dataTreeUtils";

export default async function(request: EvalWorkerASyncRequest) {
  const { data, id } = request;
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
  const unEvalTree = createUnEvalTreeForEval(__unEvalTree__);
  const {
    evalOrder,
    nonDynamicFieldValidationOrder,
  } = dataTreeEvaluator.setupUpdateTree(unEvalTree);
  dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    nonDynamicFieldValidationOrder,
  );
  const evalTree = dataTreeEvaluator.evalTree;
  const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

  return dataTreeEvaluator.evaluateTriggers(
    dynamicTrigger,
    evalTree,
    id,
    resolvedFunctions,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
