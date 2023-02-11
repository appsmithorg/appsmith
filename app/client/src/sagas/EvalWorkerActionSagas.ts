import { call, put, spawn, take } from "redux-saga/effects";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import log from "loglevel";
import { evalErrorHandler } from "../sagas/PostEvaluationSagas";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Channel } from "redux-saga";
import { storeLogs } from "../sagas/DebuggerSagas";
import {
  BatchedJSExecutionData,
  BatchedJSExecutionErrors,
} from "reducers/entityReducers/jsActionsReducer";
import { sortJSExecutionDataByCollectionId } from "workers/Evaluation/JSObject/utils";
import { MessageType, TMessage } from "utils/MessageUtil";
import {
  ResponsePayload,
  evalWorker,
  executeTriggerRequestSaga,
} from "../sagas/EvaluationsSaga";
import { logJSFunctionExecution } from "@appsmith/sagas/JSFunctionExecutionSaga";
import { handleStoreOperations } from "./ActionExecution/StoreActionSaga";
import { isEmpty } from "lodash";

/*
 * Used to evaluate and execute dynamic trigger end to end
 * Widget action fields and JS Object run triggers this flow
 *
 * We start a duplex request with the worker and wait till the time we get a 'finished' event from the
 * worker. Worker will evaluate a block of code and ask the main thread to execute it. The result of this
 * execution is returned to the worker where it can resolve/reject the current promise.
 */

export function* handleEvalWorkerRequestSaga(listenerChannel: Channel<any>) {
  while (true) {
    const request: TMessage<any> = yield take(listenerChannel);
    yield spawn(handleEvalWorkerMessage, request);
  }
}

export function* lintTreeActionHandler(message: any) {
  const { body } = message;
  const { data } = body;
  yield put({
    type: ReduxActionTypes.LINT_TREE,
    payload: {
      pathsToLint: data.lintOrder,
      unevalTree: data.unevalTree,
    },
  });
}

export function* processLogsHandler(message: any) {
  const { body } = message;
  const { data } = body;
  const { logs = [], triggerMeta, eventType } = data;
  yield call(
    storeLogs,
    logs,
    triggerMeta?.source?.name || triggerMeta?.triggerPropertyName || "",
    eventType === EventType.ON_JS_FUNCTION_EXECUTE
      ? ENTITY_TYPE.JSACTION
      : ENTITY_TYPE.WIDGET,
    triggerMeta?.source?.id || "",
  );
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
  } = yield sortJSExecutionDataByCollectionId(
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
      yield lintTreeActionHandler(message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_LOGS: {
      yield processLogsHandler(message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_JS_FUNCTION_EXECUTION: {
      yield processJSFunctionExecution(message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_TRIGGER: {
      yield processTriggerHandler(message);
      break;
    }
    case MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES: {
      yield call(handleStoreOperations, data);
      break;
    }
    case MAIN_THREAD_ACTION.LOG_JS_FUNCTION_EXECUTION: {
      yield logJSFunctionExecution(message);
      break;
    }
  }
  yield call(evalErrorHandler, data?.errors || []);
}
