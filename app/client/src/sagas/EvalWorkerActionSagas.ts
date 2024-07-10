import { all, call, put, select, spawn, take } from "redux-saga/effects";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import log from "loglevel";
import type { Channel } from "redux-saga";
import { storeLogs } from "../sagas/DebuggerSagas";
import type {
  BatchedJSExecutionData,
  BatchedJSExecutionErrors,
} from "@appsmith/reducers/entityReducers/jsActionsReducer";
import type { TMessage } from "utils/MessageUtil";
import { MessageType } from "utils/MessageUtil";
import type { ResponsePayload } from "../sagas/EvaluationsSaga";
import {
  evalWorker,
  executeTriggerRequestSaga,
  updateDataTreeHandler,
} from "../sagas/EvaluationsSaga";
import { handleStoreOperations } from "./ActionExecution/StoreActionSaga";
import type { EvalTreeResponseData } from "workers/Evaluation/types";
import isEmpty from "lodash/isEmpty";
import { sortJSExecutionDataByCollectionId } from "workers/Evaluation/JSObject/utils";
import type { LintTreeSagaRequestData } from "plugins/Linting/types";
import { evalErrorHandler } from "./EvalErrorHandler";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";

export interface UpdateDataTreeMessageData {
  workerResponse: EvalTreeResponseData;
}

export function* handleEvalWorkerRequestSaga(listenerChannel: Channel<any>) {
  while (true) {
    const request: TMessage<any> = yield take(listenerChannel);
    yield spawn(handleEvalWorkerMessage, request);
  }
}

export function* lintTreeActionHandler(message: any) {
  const { body } = message;
  const { data } = body;
  const { configTree, unevalTree } = data as LintTreeSagaRequestData;
  yield put({
    type: ReduxActionTypes.LINT_TREE,
    payload: {
      unevalTree,
      configTree,
    },
  });
}

export function* processLogsHandler(message: any) {
  const { body } = message;
  const { data } = body;
  yield call(storeLogs, data);
}

export function* processJSFunctionExecution(message: any) {
  const { body } = message;
  const {
    data: { JSExecutionData, JSExecutionErrors },
  } = body;
  const {
    sortedData,
    sortedErrors,
  }: {
    sortedData: BatchedJSExecutionData;
    sortedErrors: BatchedJSExecutionErrors;
  } = yield* sortJSExecutionDataByCollectionId(
    JSExecutionData,
    JSExecutionErrors,
  );
  if (!isEmpty(sortedData)) {
    yield put({
      type: ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_DATA,
      payload: sortedData,
    });
  }
  if (!isEmpty(sortedErrors)) {
    yield put({
      type: ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_ERRORS,
      payload: sortedErrors,
    });
  }
}

export function* processTriggerHandler(message: any) {
  const { body } = message;
  const { data } = body;
  const { eventType, trigger, triggerMeta } = data;
  const { messageType } = message;
  log.debug({ trigger: data.trigger });
  const result: ResponsePayload = yield call(
    executeTriggerRequestSaga,
    trigger,
    eventType,
    triggerMeta,
  );
  if (messageType === MessageType.REQUEST)
    yield call(evalWorker.respond, message.messageId, result);
}

export function* handleEvalWorkerMessage(message: TMessage<any>) {
  const { body } = message;
  const { data, method } = body;
  switch (method) {
    case MAIN_THREAD_ACTION.LINT_TREE: {
      yield call(lintTreeActionHandler, message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_LOGS: {
      yield call(processLogsHandler, message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_JS_FUNCTION_EXECUTION: {
      yield call(processJSFunctionExecution, message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_TRIGGER: {
      yield call(processTriggerHandler, message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES: {
      yield call(handleStoreOperations, data);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_BATCHED_TRIGGERS: {
      const batchedTriggers = data;
      yield all(
        batchedTriggers.map((data: any) => {
          const { eventType, trigger, triggerMeta } = data;
          return call(
            executeTriggerRequestSaga,
            trigger,
            eventType,
            triggerMeta,
          );
        }),
      );
      break;
    }
    case MAIN_THREAD_ACTION.UPDATE_DATATREE: {
      const { workerResponse } = data as UpdateDataTreeMessageData;
      const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
        yield select(getUnevaluatedDataTree);
      yield call(updateDataTreeHandler, {
        evalTreeResponse: workerResponse as EvalTreeResponseData,
        unevalTree: unEvalAndConfigTree.unEvalTree || {},
        requiresLogging: false,
        configTree: unEvalAndConfigTree.configTree,
      });
      break;
    }
  }

  yield call(evalErrorHandler, data?.errors || []);
}
