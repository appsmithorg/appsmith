import evaluateSync from "../evaluate";
import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerSyncRequest } from "../types";

export default function(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { functionCall } = data;

  if (!dataTreeEvaluator) {
    return true;
  }
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
