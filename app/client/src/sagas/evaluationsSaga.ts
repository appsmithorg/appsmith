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
import WidgetFactory, { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import Worker from "worker-loader!../workers/evaluation.worker";
import {
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
} from "../utils/DynamicBindingUtils";
import { ToastType } from "react-toastify";
import { AppToaster } from "../components/editorComponents/ToastComponent";
import log from "loglevel";
import _ from "lodash";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "../utils/PerformanceTracker";
import * as Sentry from "@sentry/react";

let evaluationWorker: Worker;
let workerChannel: EventChannel<any>;
let widgetTypeConfigMap: WidgetTypeConfigMap;

const initEvaluationWorkers = () => {
  // If an old worker exists, terminate it
  if (evaluationWorker) {
    evaluationWorker.terminate();
  }
  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  evaluationWorker = new Worker();
  workerChannel = eventChannel(emitter => {
    evaluationWorker.addEventListener("message", emitter);
    // The subscriber must return an unsubscribe function
    return () => {
      evaluationWorker.removeEventListener("message", emitter);
    };
  });
};

const evalErrorHandler = (errors: EvalError[]) => {
  errors.forEach(error => {
    if (error.type === EvalErrorTypes.DEPENDENCY_ERROR) {
      AppToaster.show({
        message: error.message,
        type: ToastType.ERROR,
      });
    }
    if (error.type === EvalErrorTypes.EVAL_TREE_ERROR) {
      AppToaster.show({
        message: "Unexpected error occurred while evaluating the app",
        type: ToastType.ERROR,
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

function* evaluateTreeSaga(postEvalActions?: ReduxAction<unknown>[]) {
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  const unEvalTree = yield select(getUnevaluatedDataTree);
  log.debug({ unEvalTree });
  evaluationWorker.postMessage({
    action: EVAL_WORKER_ACTIONS.EVAL_TREE,
    dataTree: unEvalTree,
    widgetTypeConfigMap,
  });
  const workerResponse = yield take(workerChannel);
  const { errors, dataTree } = workerResponse.data;
  const parsedDataTree = JSON.parse(dataTree);
  log.debug({ dataTree: parsedDataTree });
  evalErrorHandler(errors);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: parsedDataTree,
  });
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.DATA_TREE_EVALUATION,
  );
  if (postEvalActions && postEvalActions.length) {
    yield call(postEvalActionDispatcher, postEvalActions);
  }
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
  callbackData: any,
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
  initEvaluationWorkers();
  yield fork(evaluateTreeSaga);
  while (true) {
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
    log.debug(`Evaluating`, { action });
    yield fork(evaluateTreeSaga, action.postEvalActions);
  }
  // TODO(hetu) need an action to stop listening and evaluate (exit app)
}

export default function* evaluationSagaListeners() {
  yield all([
    takeLatest(ReduxActionTypes.START_EVALUATION, evaluationChangeListenerSaga),
  ]);
}
