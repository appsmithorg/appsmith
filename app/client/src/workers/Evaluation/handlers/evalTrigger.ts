import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerASyncRequest } from "../types";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import { klona } from "klona/full";
import { klona as klonaJSON } from "klona/json";
import DataStore from "../dataStore";
import { updateTreeWithData } from "../dataStore/utils";

export default async function (request: EvalWorkerASyncRequest) {
  const { data } = request;
  const {
    callbackData,
    dynamicTrigger,
    eventType,
    globalContext,
    triggerMeta,
    unEvalTree,
  } = data;
  if (!dataTreeEvaluator) {
    return { triggers: [], errors: [] };
  }

  ExecutionMetaData.setExecutionMetaData({ triggerMeta, eventType });

  const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
    dataTreeEvaluator.setupUpdateTree(
      unEvalTree.unEvalTree,
      unEvalTree.configTree,
    );

  dataTreeEvaluator.evalAndValidateSubTree(
    evalOrder,
    nonDynamicFieldValidationOrder,
    unEvalTree.configTree,
    unEvalUpdates,
  );
  const evalTree = klona(dataTreeEvaluator.evalTree);
  const dataStore = klonaJSON(DataStore.getDataStore());

  updateTreeWithData(evalTree, dataStore);

  return dataTreeEvaluator.evaluateTriggers(
    dynamicTrigger,
    evalTree,
    unEvalTree.configTree,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
