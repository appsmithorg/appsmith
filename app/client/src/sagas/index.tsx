import { all, spawn } from "redux-saga/effects";
import { watchFetchPageSaga } from "../sagas/PageSagas";
import { fetchWidgetCardsSaga } from "./WidgetCardsPaneSagas";
import { watchExecuteActionSaga } from "./ActionSagas";

export function* rootSaga() {
  yield all([
    spawn(watchFetchPageSaga),
    spawn(fetchWidgetCardsSaga),
    spawn(watchExecuteActionSaga),
  ]);
}
