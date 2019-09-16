import { all, fork, spawn } from "redux-saga/effects"
import { watchFetchPage } from "../sagas/PageSagas"
import { fetchWidgetCardsSaga } from './WidgetCardsPaneSagas'
import { watchExecuteAction } from './ActionSagas';

export function* rootSaga() {
  yield all([ spawn(watchFetchPage), spawn(fetchWidgetCardsSaga), spawn(watchExecuteAction)])
}
