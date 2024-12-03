import { klona } from "klona/full";
import { evaluateAsync } from "../evaluate";
import type { EvalWorkerASyncRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const klona13 = (data: any) => {
  return klona(data);
};

export default function (request: EvalWorkerASyncRequest) {
  const { data } = request;
  const { expression } = data;
  const evalTree = dataTreeEvaluator?.evalTree;
  const configTree = dataTreeEvaluator?.configTree;

  if (!evalTree || !configTree) return {};

  return evaluateAsync(
    expression,
    klona13(evalTree),
    configTree,
    {},
    undefined,
  );
}
