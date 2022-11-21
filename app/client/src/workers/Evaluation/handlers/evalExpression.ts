import evaluateSync, { evaluateAsync } from "../evaluate";
import { EvalWorkerRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";

export default function(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { expression, isTrigger } = requestData;
  const evalTree = dataTreeEvaluator?.evalTree;
  if (!evalTree) return {};
  return isTrigger
    ? evaluateAsync(expression, evalTree, "SNIPPET", {})
    : evaluateSync(expression, evalTree, {}, false);
}
