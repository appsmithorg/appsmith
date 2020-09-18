import { all, takeLatest, select, put } from "redux-saga/effects";
import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { getUnevaluatedDataTree } from "../selectors/dataTreeSelectors";
import { getEvaluatedDataTree } from "../utils/DynamicBindingUtils";

function* evaluateTreeSaga() {
  const unEvalTree = yield select(getUnevaluatedDataTree(true));
  const evalTree = getEvaluatedDataTree(unEvalTree);
  yield put({
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: evalTree,
  });
}

export default function* evaluationSagaListeners() {
  yield all([
    // takeLatest(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS, evaluateTreeSaga),
  ]);
}
