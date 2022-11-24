import evaluateSync, { evaluateAsync } from "../evaluate";
import { EvalWorkerRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";

export default function(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { expression, isTrigger } = requestData;
  const evalTree = dataTreeEvaluator?.evalTree;
  if (!evalTree) return {};
  if (isTrigger) {
    evaluateAsync(expression, evalTree, "SNIPPET", {});
    return;
  }
  return evaluateSync(expression, evalTree, {}, false);
}
