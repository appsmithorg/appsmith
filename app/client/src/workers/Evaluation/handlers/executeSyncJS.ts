import evaluateSync from "../evaluate";
import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerRequest } from "../types";

export default function(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { functionCall } = requestData;

  if (!dataTreeEvaluator) {
    return true;
  }
  const evalTree = dataTreeEvaluator.evalTree;
  const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;
  const { errors, logs, result } = evaluateSync(
    functionCall,
    evalTree,
    resolvedFunctions,
    false,
    undefined,
  );
  return { errors, logs, result };
}
