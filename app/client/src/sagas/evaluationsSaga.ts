import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import { eventChannel, EventChannel } from "redux-saga";
import {
  EvaluationReduxAction,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  getDataTree,
  getUnevaluatedDataTree,
} from "selectors/dataTreeSelectors";
import WidgetFactory from "../utils/WidgetFactory";
import Worker from "worker-loader!../workers/evaluation.worker";
import {
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
} from "../utils/DynamicBindingUtils";
import log from "loglevel";
import _ from "lodash";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "../utils/PerformanceTracker";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import * as Sentry from "@sentry/react";

let evaluationWorker: Worker;
let workerChannel: EventChannel<any>;
let evalQueue: Array<{
  queued: Date;
  action: EvaluationReduxAction<unknown | unknown[]>;
}> = [];

function* initEvaluationWorkers(action: EvaluationReduxAction<any>) {
  // If an old worker exists, terminate it
  if (evaluationWorker) {
    evaluationWorker.terminate();
  }
  evaluationWorker = new Worker();
  workerChannel = eventChannel(emitter => {
    evaluationWorker.addEventListener("message", emitter);
    // The subscriber must return an unsubscribe function
    return () => {
      evaluationWorker.removeEventListener("message", emitter);
    };
  });
  const widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  const unevalTree = yield select(getUnevaluatedDataTree);
  evaluationWorker.postMessage({
    action: EVAL_WORKER_ACTIONS.INIT_EVALUATOR,
    unevalTree,
    widgetTypeConfigMap,
  });
  const workerResponse = yield take(workerChannel);
  console.log({ workerResponse });
  const { errors, dataTree, dependencies } = workerResponse.data;
  log.debug({ dataTree });
  evalErrorHandler(errors);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: dataTree,
  });
  yield put({
    type: ReduxActionTypes.SET_EVALUATION_DEPENDENCIES,
    payload: dependencies,
  });
  if (action && action.postEvalActions && action.postEvalActions.length) {
    yield call(postEvalActionDispatcher, action.postEvalActions);
  }
  // yield call(processEvalQueue);
}

const evalErrorHandler = (errors: EvalError[]) => {
  errors.forEach(error => {
    if (error.type === EvalErrorTypes.DEPENDENCY_ERROR) {
      Toaster.show({
        text: error.message,
        variant: Variant.danger,
      });
    }
    if (error.type === EvalErrorTypes.EVAL_TREE_ERROR) {
      Toaster.show({
        text: "Unexpected error occurred while evaluating the app",
        variant: Variant.danger,
      });
      Sentry.captureException(error);
    }
    log.debug(error);
  });
};

function* postEvalActionDispatcher(actions: ReduxAction<unknown>[]) {
  for (const action of actions) {
    yield put(action);
  }
}

function* processEvalQueue() {
  if (evalQueue.length) {
    const allPostEvalActions: EvaluationReduxAction<unknown | unknown[]>[] = [];
    evalQueue.forEach(enqueuedAction => {
      const postEvalActions = enqueuedAction.action.postEvalActions;
      if (postEvalActions && postEvalActions.length) {
        allPostEvalActions.push(...postEvalActions);
      }
    });
    log.debug("Evaluating queue of actions");
    log.debug(evalQueue);
    evalQueue = [];
    yield fork(evaluateTreeSaga, allPostEvalActions);
  }
}

function* evaluateTreeSaga(postEvalActions?: ReduxAction<unknown>[]) {
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  const unevalTree = yield select(getUnevaluatedDataTree);
  const mainEvalStart = performance.now();
  evaluationWorker.postMessage({
    action: EVAL_WORKER_ACTIONS.EVAL_TREE,
    unevalTree,
  });
  const workerResponse = yield take(workerChannel);
  const mainEvalStop = performance.now();
  console.log({ mainEval: (mainEvalStop - mainEvalStart).toFixed(2) });
  const { errors, dataTree, dependencies } = workerResponse.data;
  log.debug({ dataTree });
  evalErrorHandler(errors);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: dataTree,
  });
  if (postEvalActions && postEvalActions.length) {
    yield call(postEvalActionDispatcher, postEvalActions);
  }
  // yield put({
  //   type: ReduxActionTypes.SET_UNEVALUATED_TREE,
  //   payload: unevalTree,
  // });
  put({
    type: ReduxActionTypes.SET_EVALUATION_DEPENDENCIES,
    payload: dependencies,
  });
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
}

export function* evaluateSingleValue(binding: string) {
  if (evaluationWorker) {
    const dataTree = yield select(getDataTree);
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.EVAL_SINGLE,
      dataTree,
      binding,
    });
    const workerResponse = yield take(workerChannel);
    const { errors, value } = workerResponse.data;
    evalErrorHandler(errors);
    return value;
  }
}

export function* evaluateDynamicTrigger(
  dynamicTrigger: string,
  callbackData?: Array<any>,
) {
  if (evaluationWorker) {
    const unEvalTree = yield select(getUnevaluatedDataTree);
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.EVAL_TRIGGER,
      dataTree: unEvalTree,
      dynamicTrigger,
      callbackData,
    });
    const workerResponse = yield take(workerChannel);
    const { errors, triggers } = workerResponse.data;
    evalErrorHandler(errors);
    return triggers;
  }
  return [];
}

export function* clearEvalCache() {
  if (evaluationWorker) {
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.CLEAR_CACHE,
    });
    yield take(workerChannel);
    return true;
  }
}

export function* clearEvalPropertyCache(propertyPath: string) {
  if (evaluationWorker) {
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE,
      propertyPath,
    });
    yield take(workerChannel);
  }
}

/**
 * clears all cache keys of a widget
 *
 * @param widgetName
 */
export function* clearEvalPropertyCacheOfWidget(widgetName: string) {
  if (evaluationWorker) {
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.CLEAR_PROPERTY_CACHE_OF_WIDGET,
      widgetName,
    });
    yield take(workerChannel);
  }
}

export function* validateProperty(
  widgetType: WidgetType,
  property: string,
  value: any,
  props: WidgetProps,
) {
  if (evaluationWorker) {
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY,
      widgetType,
      property,
      value,
      props,
    });
    const response = yield take(workerChannel);
    return response.data;
  }
  return { isValid: true, parsed: value };
}

const EVALUATE_REDUX_ACTIONS = [
  // Actions
  ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
  ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
  ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
  ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
  ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
  ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
  ReduxActionTypes.CREATE_ACTION_SUCCESS,
  ReduxActionTypes.UPDATE_ACTION_PROPERTY,
  ReduxActionTypes.DELETE_ACTION_SUCCESS,
  ReduxActionTypes.COPY_ACTION_SUCCESS,
  ReduxActionTypes.MOVE_ACTION_SUCCESS,
  ReduxActionTypes.RUN_ACTION_REQUEST,
  ReduxActionTypes.RUN_ACTION_SUCCESS,
  ReduxActionErrorTypes.RUN_ACTION_ERROR,
  ReduxActionTypes.EXECUTE_API_ACTION_REQUEST,
  ReduxActionTypes.EXECUTE_API_ACTION_SUCCESS,
  ReduxActionErrorTypes.EXECUTE_ACTION_ERROR,
  // App Data
  ReduxActionTypes.SET_APP_MODE,
  ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
  ReduxActionTypes.SET_URL_DATA,
  ReduxActionTypes.UPDATE_APP_STORE,
  // Widgets
  ReduxActionTypes.UPDATE_LAYOUT,
  ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
  ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS,
  // Widget Meta
  ReduxActionTypes.SET_META_PROP,
  ReduxActionTypes.RESET_WIDGET_META,
  // Pages
  ReduxActionTypes.FETCH_PAGE_SUCCESS,
  ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
  // Batches
  ReduxActionTypes.BATCH_UPDATES_SUCCESS,
];

function* evaluationChangeListenerSaga() {
  // Waiting for the first update layout
  const action = yield take([
    ReduxActionTypes.FETCH_PAGE_SUCCESS,
    ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS,
  ]);
  yield fork(initEvaluationWorkers, action);
  while (true) {
    yield fork(processEvalQueue);
    const action: EvaluationReduxAction<unknown | unknown[]> = yield take(
      EVALUATE_REDUX_ACTIONS,
    );
    // When batching success action happens, we need to only evaluate
    // if the batch had any action we need to evaluate properties for
    if (
      action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
      Array.isArray(action.payload)
    ) {
      const batchedActionTypes = action.payload.map(
        (batchedAction: ReduxAction<unknown>) => batchedAction.type,
      );
      if (
        _.intersection(EVALUATE_REDUX_ACTIONS, batchedActionTypes).length === 0
      ) {
        continue;
      }
    }
    evalQueue.push({
      queued: new Date(),
      action,
    });
  }
}

export default function* evaluationSagaListeners() {
  yield all([
    takeLatest(ReduxActionTypes.START_EVALUATION, evaluationChangeListenerSaga),
  ]);
}
