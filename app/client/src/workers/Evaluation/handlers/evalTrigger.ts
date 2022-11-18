import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerRequest } from "../types";

export default function(request: EvalWorkerRequest) {
  const { requestData, requestId } = request;
  const {
    callbackData,
    dataTree,
    dynamicTrigger,
    eventType,
    globalContext,
    triggerMeta,
  } = requestData;
  if (!dataTreeEvaluator) {
    return { triggers: [], errors: [] };
  }
  const {
    evalOrder,
    nonDynamicFieldValidationOrder,
  } = dataTreeEvaluator.setupUpdateTree(dataTree);
  dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    nonDynamicFieldValidationOrder,
  );
  const evalTree = dataTreeEvaluator.evalTree;
  const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

  dataTreeEvaluator.evaluateTriggers(
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
