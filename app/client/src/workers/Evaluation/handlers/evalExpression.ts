import { klona } from "klona/full";
import { klona as klonaJSON } from "klona/json";
import { evaluateAsync } from "../evaluate";
import type { EvalWorkerASyncRequest } from "../types";
import { dataTreeEvaluator } from "./evalTree";
import DataStore from "../dataStore";
import { updateTreeWithData } from "../dataStore/utils";

export default function (request: EvalWorkerASyncRequest) {
  const { data } = request;
  const { expression } = data;
  const dataTree = dataTreeEvaluator?.evalTree;
  const configTree = dataTreeEvaluator?.configTree;
  if (!dataTree || !configTree) return {};
  const evalTree = klona(dataTree);
  const dataStore = klonaJSON(DataStore.getDataStore());
  updateTreeWithData(evalTree, dataStore);
  return evaluateAsync(expression, evalTree, configTree, {}, undefined);
}
