import { dataTreeEvaluator } from "./evalTree";
import type { EvalWorkerASyncRequest } from "../types";
import ExecutionMetaData from "../fns/utils/ExecutionMetaData";
import { getJSEntities } from "../JSObject";

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

  if (!triggerMeta.onPageLoad) {
    const { evalOrder, unEvalUpdates } = dataTreeEvaluator.setupUpdateTree(
      unEvalTree.unEvalTree,
      unEvalTree.configTree,
      undefined,
      //TODO: the evalTrigger can be optimised to not diff all JS actions
      [
        ...Object.values(
          getJSEntities(dataTreeEvaluator.getOldUnevalTree()),
        ).map((v) => v.actionId),
        ...Object.values(getJSEntities(unEvalTree.unEvalTree)).map(
          (v) => v.actionId,
        ),
      ],
    );

    dataTreeEvaluator.evalAndValidateSubTree(
      evalOrder,
      unEvalTree.configTree,
      unEvalUpdates,
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
