import { evaluateAsync } from "../evaluate";
import { EvalWorkerASyncRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";

export default function(request: EvalWorkerASyncRequest) {
  const { requestData } = request;
  const { expression } = requestData;
  const evalTree = dataTreeEvaluator?.evalTree;
  if (!evalTree) return {};
  return evaluateAsync(expression, evalTree, "SNIPPET", {});
}
