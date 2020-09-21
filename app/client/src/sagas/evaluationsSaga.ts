import { all, call, select, put, takeLatest, take } from "redux-saga/effects";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import jsonFn from "json-fn";

function* evaluateTreeSaga() {
  const unEvalTree = yield select(getUnevaluatedDataTree(true));
  const evalTree = getEvaluatedDataTree(unEvalTree);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: evalTree,
  });
}

function* evaluationChangeListenerSaga() {
  yield call(evaluateTreeSaga);
  let oldUnEvalTree = "";
  while (true) {
    yield take("*");
    const unEvalTree = yield select(getUnevaluatedDataTree(false));
    const unEvalString = jsonFn.stringify(unEvalTree);
    if (unEvalString !== oldUnEvalTree) {
      yield call(evaluateTreeSaga);
      oldUnEvalTree = unEvalString;
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
