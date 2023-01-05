import evaluateSync from "../evaluate";
import { dataTreeEvaluator } from "./evalTree";
import { EvalWorkerSyncRequest } from "../types";
import userLogs from "../fns/console";

export default function(request: EvalWorkerSyncRequest) {
  const { data } = request;
  const { eventType, functionCall, triggerMeta } = data;

  if (!dataTreeEvaluator) {
    return true;
  }
  userLogs.setupConsole(eventType, triggerMeta);
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
