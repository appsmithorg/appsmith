import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import {
  actionChannel,
  ActionPattern,
  call,
  put,
  take,
  delay,
} from "redux-saga/effects";
import TernServer from "utils/autocomplete/TernServer";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { EvalWorker } from "./EvaluationsSaga";

export function* installLibrary(url: string) {
  const { defs, status } = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.INSTALL_LIBRARY,
    url,
  );
  if (status) {
    TernServer.updateDef(defs["!name"], defs);
    yield delay(10000);
    yield put({
      type: ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
      payload: url,
    });
  }
}

export default function*() {
  const queueInstallChannel: ActionPattern<any> = yield actionChannel([
    ReduxActionTypes.INSTALL_LIBRARY_INIT,
  ]);
  while (true) {
    const action: ReduxAction<string> = yield take(queueInstallChannel);
    yield put({
      type: ReduxActionTypes.INSTALL_LIBRARY_START,
      payload: action.payload,
    });
    yield call(installLibrary, action.payload);
  }
}
