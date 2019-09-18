import { all, spawn } from "redux-saga/effects";
import pageSagas from "../sagas/PageSagas";
import { fetchWidgetCardsSaga } from "./WidgetCardsPaneSagas";
import { watchExecuteActionSaga } from "./ActionSagas";

export function* rootSaga() {
  yield all([
    spawn(pageSagas),
    spawn(fetchWidgetCardsSaga),
    spawn(watchExecuteActionSaga),
  ]);
}
