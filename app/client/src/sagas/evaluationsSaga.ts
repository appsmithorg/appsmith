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

let evaluationWorker: Worker;
let workerChannel: EventChannel<any>;
let widgetTypeConfigMap: WidgetTypeConfigMap;

const initEvaluationWorkers = () => {
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
        message: error.error.message,
        type: ToastType.ERROR,
      });
    }
    log.debug(error);
  });
};

function* evaluateTreeSaga() {
  const unEvalTree = yield select(getUnevaluatedDataTree);
  log.debug({ unEvalTree });
  evaluationWorker.postMessage({
    action: EVAL_WORKER_ACTIONS.EVAL_TREE,
    dataTree: unEvalTree,
    widgetTypeConfigMap,
  });
  const workerResponse = yield take(workerChannel);
  const { errors, dataTree } = workerResponse.data;
  log.debug({ dataTree });
  evalErrorHandler(errors);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: JSON.parse(dataTree),
  });
}

export function* evaluateSingleValue(binding: string) {
  if (evaluationWorker) {
    const evalTree = yield select(getDataTree);
    evaluationWorker.postMessage({
      action: EVAL_WORKER_ACTIONS.EVAL_SINGLE,
      dataTree: evalTree,
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
  // Widget Meta
  ReduxActionTypes.SET_META_PROP,
  ReduxActionTypes.RESET_WIDGET_META,
  // Batches
  ReduxActionTypes.BATCH_UPDATES_SUCCESS,
];

function* evaluationChangeListenerSaga() {
  initEvaluationWorkers();
  yield call(evaluateTreeSaga);
  while (true) {
    const action: ReduxAction<any> = yield take(EVALUATE_REDUX_ACTIONS);
    // When batching success action happens, we need to only evaluate
    // if the batch had any action we need to evaluate properties for
    if (action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS) {
      const batchedActionTypes = action.payload.map(
        (batchedAction: ReduxAction<any>) => batchedAction.type,
      );
      if (
        _.intersection(EVALUATE_REDUX_ACTIONS, batchedActionTypes).length === 0
      ) {
        continue;
      }
    }
    yield fork(evaluateTreeSaga);
  }
  // TODO(hetu) need an action to stop listening and evaluate (exit app)
}

export default function* evaluationSagaListeners() {
  yield all([
    takeLatest(
      ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
      evaluationChangeListenerSaga,
    ),
    takeLatest(
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
      evaluationChangeListenerSaga,
    ),
  ]);
}
