/* eslint-disable import/no-webpack-loader-syntax */
import { all, call, put, select, take, takeLatest } from "redux-saga/effects";
import { eventChannel, EventChannel } from "redux-saga";
import JSONFn from "json-fn";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import WidgetFactory, { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import evaluateTreeWorker from "worker-loader!../workers/evaluation-worker";
import { ValidationType, Validator } from "../constants/WidgetValidation";
import ValidationFactory from "../utils/ValidationFactory";

let evaluationWorker: Worker;
let workerChannel: EventChannel<any>;
let widgetTypeConfigMap: WidgetTypeConfigMap;
let validators: Map<ValidationType, Validator>;

const initEvaluationWorkers = () => {
  widgetTypeConfigMap = WidgetFactory.getWidgetTypeConfigMap();
  validators = ValidationFactory.validationMap;
  evaluationWorker = new evaluateTreeWorker();
  workerChannel = eventChannel(emitter => {
    evaluationWorker.addEventListener("message", emitter);
    // The subscriber must return an unsubscribe function
    return () => {
      evaluationWorker.removeEventListener("message", emitter);
    };
  });
};

function* evaluateTreeSaga() {
  const unEvalTree = yield select(getUnevaluatedDataTree(false));
  const data = JSONFn.stringify({
    dataTree: unEvalTree,
    widgetTypeConfigMap,
    validators,
  });
  console.log({ data });
  evaluationWorker.postMessage(data);
  const workerResponse = yield take(workerChannel);
  const evalTree = JSON.parse(workerResponse.data);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: evalTree,
  });
}

function* evaluationChangeListenerSaga() {
  initEvaluationWorkers();
  yield call(evaluateTreeSaga);
  while (true) {
    yield take("*");
    const unEvalTree = yield select(getUnevaluatedDataTree(false));
    const unEvalString = JSONFn.stringify(unEvalTree);
    if (unEvalString !== oldUnEvalTree) {
      yield call(evaluateTreeSaga);
    }
  }
  // TODO(hetu) need an action to stop listening and evaluate (exit editor)
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
