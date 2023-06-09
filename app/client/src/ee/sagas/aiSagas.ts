import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { takeLatest, all, call, put, select } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  TChatGPTContext,
  TChatGPTPrompt,
} from "@appsmith/components/editorComponents/GPT/utils";
import { selectGPTTriggerContext } from "@appsmith/components/editorComponents/GPT/utils";
import type { GPTTask } from "@appsmith/components/editorComponents/GPT/utils";
import { evalWorker } from "sagas/EvaluationsSaga";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { GPTTriggerContext } from "@appsmith/reducers/AIReducer";

export function* evaluateGPTResponse(
  action: ReduxAction<{ expression: string; task: GPTTask; messageId: string }>,
) {
  const { expression, messageId, task } = action.payload;
  const wrapperExpression = expression;
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

function* askAI(
  action: ReduxAction<{
    query: string;
    context: TChatGPTContext;
    task: GPTTask;
  }>,
) {
  yield put({
    type: ReduxActionTypes.AI_LOADING,
    payload: true,
  });
  const { context, query, task } = action.payload;
  AnalyticsUtil.logEvent("AI_QUERY_SENT", {
    requestedOutputType: task,
    characterCount: query.length,
    userQuery: query,
    context,
  });
  let modifiedQuery = query;
  const triggerContext: GPTTriggerContext = yield select(
    selectGPTTriggerContext,
  );
  if (triggerContext.expectedType) {
    modifiedQuery = `${modifiedQuery}. Return type of the expression should be ${triggerContext.expectedType}`;
  }
  if (triggerContext.example) {
    modifiedQuery = `${modifiedQuery}. An example structure of the returned value is ${triggerContext.example}`;
  }
  const start = performance.now();
  try {
    const res: Response = yield fetch(
      `/api/v1/chat/chat-generation?type=${task}`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_query: modifiedQuery,
          ...context,
        }),
      },
    );
    const result: { data: any; responseMeta: any } = yield res.json();
    if (!res?.ok) {
      throw new Error(
        result?.responseMeta?.error?.message || "Something went wrong",
      );
    }
    const message: TChatGPTPrompt = {
      role: "assistant",
      content: result.data.response,
      messageId: result.data.messageId,
      task: task,
      query,
    };
    yield put({
      type: ReduxActionTypes.ADD_GPT_MESSAGE,
      payload: message,
    });
    yield put({
      type: ReduxActionTypes.AI_LOADING,
      payload: false,
    });
    AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
      success: true,
      requestedOutputType: task,
      responseId: message.messageId,
      generatedCode: message.content,
      userQuery: query,
      context,
      timeTaken: performance.now() - start,
    });
  } catch (e) {
    yield put({
      type: ReduxActionTypes.AI_LOADING,
      payload: false,
    });
    AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
      success: false,
      requestedOutputType: task,
      timeTaken: performance.now() - start,
      userQuery: query,
    });
    yield put({
      type: ReduxActionTypes.ADD_GPT_MESSAGE,
      payload: { role: "error", content: (e as any).message, task },
    });
  }
}

export default function* AISagas() {
  yield all([
    takeLatest(ReduxActionTypes.EVALUATE_GPT_RESPONSE, evaluateGPTResponse),
    takeLatest(ReduxActionTypes.ASK_AI, askAI),
  ]);
}
