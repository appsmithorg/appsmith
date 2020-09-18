import { all, call, select, put, takeLatest, take } from "redux-saga/effects";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "../selectors/dataTreeSelectors";
import { getEvaluatedDataTree } from "../utils/DynamicBindingUtils";
import { DataTree } from "../entities/DataTree/dataTreeFactory";
import isEqual from "fast-deep-equal/es6";

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
    if (!isEqual(unEvalTree, oldUnEvalTree)) {
      oldUnEvalTree = unEvalTree;
      yield call(evaluateTreeSaga);
    }
    // ;
    // const changes = Object.keys(unEvalTree).map(key => {
    //   if (key && oldUnEvalTree && key in oldUnEvalTree) {
    //     return { [key]: oldUnEvalTree[key] !== unEvalTree[key] };
    //   } else {
    //     return { [key]: true };
    //   }
    // });
    // if (_.some(_.values(changes))) {
    //   oldUnEvalTree = unEvalTree;
    //   console.log({ changes });
    //   yield call(evaluateTreeSaga);
    // }
  }
}

export default function* evaluationSagaListeners() {
  yield all([
    takeLatest(
      ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
      evaluationChangeListenerSaga,
    ),
  ]);
}
