import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { takeLatest, all, call, put } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { GPTTask } from "@appsmith/components/editorComponents/GPT/utils";
import { evalWorker } from "sagas/EvaluationsSaga";
import { EVAL_WORKER_ACTIONS } from "ce/workers/Evaluation/evalWorkerActions";
import AnalyticsUtil from "utils/AnalyticsUtil";

export function* evaluateGPTResponse(
  action: ReduxAction<{ expression: string; task: GPTTask; messageId: string }>,
) {
  const { expression, messageId, task } = action.payload;
  let wrapperExpression = expression;
  if (task === GPTTask.JS_FUNCTION) {
    wrapperExpression = `(${expression})()`;
  }
  AnalyticsUtil.logEvent("AI_RESPONSE_EXECUTION_INIT", {
    expression: expression,
    script: wrapperExpression,
    task,
    messageId,
  });
  const { errors, result } = yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.EVAL_EXPRESSION,
    {
      expression: wrapperExpression,
    },
  );

  if (errors && errors.length) {
    AnalyticsUtil.logEvent("AI_RESPONSE_EXECUTION_FAILED", {
      expression: expression,
      script: wrapperExpression,
      error: errors[0]?.errorMessage,
      task,
      messageId,
    });
  }

  yield put({
    type: ReduxActionTypes.EVALUATE_GPT_RESPONSE_COMPLETE,
    payload: {
      result:
        result ||
        `${errors?.[0]?.errorMessage.name}: ${errors?.[0]?.errorMessage.message}`,
      messageId,
    },
  });
}

export default function* AISagas() {
  yield all([
    takeLatest(ReduxActionTypes.EVALUATE_GPT_RESPONSE, evaluateGPTResponse),
  ]);
}
