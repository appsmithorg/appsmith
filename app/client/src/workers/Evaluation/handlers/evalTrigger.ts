import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerASyncRequest } from "../types";
import { createUnEvalTreeForEval } from "../dataTreeUtils";

export default async function(request: EvalWorkerASyncRequest) {
  const { requestData, requestId } = request;
  const {
    callbackData,
    dynamicTrigger,
    eventType,
    globalContext,
    triggerMeta,
    unEvalTree: __unEvalTree__,
  } = requestData;
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
    requestId,
    resolvedFunctions,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
