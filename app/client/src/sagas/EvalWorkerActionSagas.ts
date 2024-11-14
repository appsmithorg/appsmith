import { all, call, put, select, spawn, take } from "redux-saga/effects";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { MAIN_THREAD_ACTION } from "ee/workers/Evaluation/evalWorkerActions";
import log from "loglevel";
import type { Channel } from "redux-saga";
import { storeLogs } from "../sagas/DebuggerSagas";
import type {
  BatchedJSExecutionData,
  BatchedJSExecutionErrors,
} from "ee/reducers/entityReducers/jsActionsReducer";
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
import { endSpan, startRootSpan } from "UITelemetry/generateTraces";

export interface UpdateDataTreeMessageData {
  workerResponse: EvalTreeResponseData;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* handleEvalWorkerRequestSaga(listenerChannel: Channel<any>) {
  while (true) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request: TMessage<any> = yield take(listenerChannel);

    yield spawn(handleEvalWorkerMessage, request);
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* processLogsHandler(message: any) {
  const { body } = message;
  const { data } = body;

  yield call(storeLogs, data);
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const rootSpan = startRootSpan("DataTreeFactory.create");

      const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
        yield select(getUnevaluatedDataTree);

      endSpan(rootSpan);

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
