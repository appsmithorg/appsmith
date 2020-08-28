import { takeLatest, select, call, put } from "redux-saga/effects";
import { AppState } from "reducers";
import {
  getActionsForCurrentPage,
  getAppData,
} from "selectors/entitiesSelector";
import { getWidgets, getWidgetsMeta } from "sagas/selectors";
import { getPageList } from "selectors/editorSelectors";
import { DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import { getEvaluatedDataTree } from "utils/DynamicBindingUtils";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

function* evaluateSaga() {
  console.log("Eval start");
  const actions = yield select(getActionsForCurrentPage);
  const widgets = yield select(getWidgets);
  const widgetsMeta = yield select(getWidgetsMeta);
  const pageList = yield select(getPageList);
  const appData = yield select(getAppData);
  const unEvalTree = DataTreeFactory.create(
    {
      actions,
      widgets,
      widgetsMeta,
      pageList,
      appData,
    },
    true,
  );
  console.log({ unEvalTree });
  const evalTree = getEvaluatedDataTree(unEvalTree);
  yield put({
    type: ReduxActionTypes.UPDATE_DATA_TREE,
    payload: evalTree,
  });
}

let oldState: AppState["entities"];
function* checkForChangesSaga() {
  const state: AppState = yield select();
  if (state.entities !== oldState) {
    yield call(evaluateSaga);
    oldState = state.entities;
  }
}

export default function* evaluationTriggerSaga() {
  yield takeLatest(ReduxActionTypes.FORCE_EVAL, evaluateSaga);
  // yield takeLatest("*", checkForChangesSaga);
}
