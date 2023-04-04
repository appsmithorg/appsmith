import evaluateSync from "../evaluate";
import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerSyncRequest } from "../types";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";

export default function (request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { eventType, functionCall, triggerMeta } = data;
  if (!dataTreeEvaluator) {
    return true;
  }
  ExecutionMetaData.setExecutionMetaData(triggerMeta, eventType);
  const evalTree = dataTreeEvaluator.evalTree;
  const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;
  return evaluateSync(
    functionCall,
    evalTree,
    resolvedFunctions,
    false,
    undefined,
  );
}
