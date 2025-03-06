import store from "store";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import { evalWorker } from "utils/workerInstances";
import { EVAL_WORKER_ACTIONS } from "ee/workers/Evaluation/evalWorkerActions";
import { runSaga } from "redux-saga";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";

export async function UNSTABLE_executeDynamicTrigger(dynamicTrigger: string) {
  const state = store.getState();
  const unEvalTree = getUnevaluatedDataTree(state);

  const result = runSaga(
    {},
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_TRIGGER,
    {
      unEvalTree,
      dynamicTrigger,
      triggerMeta: {
        onPageLoad: false,
        triggerKind: TriggerKind.EVENT_EXECUTION,
      },
    },
  );

  return result.toPromise();
}
