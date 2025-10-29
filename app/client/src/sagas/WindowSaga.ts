import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { takeLatest, select, call } from "redux-saga/effects";
import { evaluateTreeSaga } from "./EvaluationsSaga";
import { getUnevaluatedDataTree } from "selectors/dataTreeSelectors";

export function* handleWindowDimensionsUpdate() {
  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield select(getUnevaluatedDataTree);

  yield call(evaluateTreeSaga, unEvalAndConfigTree);
}

export default function* windowSaga() {
  yield takeLatest(
    ReduxActionTypes.UPDATE_WINDOW_DIMENSIONS,
    handleWindowDimensionsUpdate,
  );
}
