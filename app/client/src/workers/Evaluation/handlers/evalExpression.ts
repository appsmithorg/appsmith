import { evaluateAsync } from "../evaluate";
import type { EvalWorkerASyncRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";

export default function (request: EvalWorkerASyncRequest) {
  const { data } = request;
  const { expression } = data;
  const evalTree = dataTreeEvaluator?.evalTree;
  const resolvedFunctions = dataTreeEvaluator?.resolvedFunctions || {};
  if (!evalTree) return {};
  return evaluateAsync(expression, evalTree, resolvedFunctions, {});
}
