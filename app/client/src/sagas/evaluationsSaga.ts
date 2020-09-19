import { all, call, select, put, takeLatest, take } from "redux-saga/effects";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";

function* evaluateTreeSaga() {
  const unEvalTree = yield select(getUnevaluatedDataTree(true));
  const evalTree = getEvaluatedDataTree(unEvalTree);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: evalTree,
  });
}

let oldUnEvalTree: DataTree = {};
function* evaluationChangeListenerSaga() {
  yield call(evaluateTreeSaga);
  while (true) {
    yield take("*");
    const unEvalTree = yield select(getUnevaluatedDataTree(false));
    if (unEvalTree !== oldUnEvalTree) {
      oldUnEvalTree = unEvalTree;
      yield call(evaluateTreeSaga);
    }
  }
  // TODO need an action to stop listening and evaluate (exit editor)
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
