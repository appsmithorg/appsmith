import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerASyncRequest } from "../types";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import { evaluateAndPushResponse } from "../evalTreeWithChanges";
import { klona } from "klona";

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

  const oldEvalTree = klona(dataTreeEvaluator.getEvalTree());

  if (!triggerMeta.onPageLoad) {
    const { evalOrder, unEvalUpdates } = dataTreeEvaluator.setupUpdateTree(
      unEvalTree.unEvalTree,
      unEvalTree.configTree,
      undefined,
      //TODO: the evalTrigger can be optimised to not diff all JS actions
      { isAllAffected: true, ids: [] },
    );

    evaluateAndPushResponse(
      dataTreeEvaluator,
      { evalOrder, unEvalUpdates, jsUpdates: {} },
      [],
      [],
      oldEvalTree,
    );
  }

  return dataTreeEvaluator.evaluateTriggers(
    dynamicTrigger,
    dataTreeEvaluator.getEvalTree(),
    unEvalTree.configTree,
    callbackData,
    {
      globalContext,
      eventType,
      triggerMeta,
    },
  );
}
