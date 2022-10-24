import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { all, call, takeEvery } from "redux-saga/effects";
import TernServer from "utils/autocomplete/TernServer";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { EvalWorker } from "./EvaluationsSaga";

export function* installLibrary(action: ReduxAction<string>) {
  const url = action.payload;
  const { defs, status } = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.INSTALL_LIBRARY,
    url,
  );
  if (status) {
    TernServer.updateDef(defs["!name"], defs);
  }
}

export default function*() {
  yield all([takeEvery(ReduxActionTypes.INSTALL_LIBRARY_INIT, installLibrary)]);
}
