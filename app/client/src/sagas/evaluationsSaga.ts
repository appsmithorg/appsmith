import { all, call, put, select, take, takeLatest } from "redux-saga/effects";
import { eventChannel, EventChannel } from "redux-saga";
import JSONFn from "json-fn";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import WidgetFactory, { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import evaluateTreeWorker from "worker-loader!../workers/evaluation.worker";

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

function* evaluateTreeSaga() {
  const unEvalTree = yield select(getUnevaluatedDataTree);
  const data = JSONFn.stringify({
    dataTree: unEvalTree,
    widgetTypeConfigMap,
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

let oldUnEvalTree = "";
function* evaluationChangeListenerSaga() {
  initEvaluationWorkers();
  yield call(evaluateTreeSaga);
  while (true) {
    yield take("*");
    const unEvalTree = yield select(getUnevaluatedDataTree);
    const unEvalString = JSONFn.stringify(unEvalTree);
    if (unEvalString !== oldUnEvalTree) {
      oldUnEvalTree = unEvalString;
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
