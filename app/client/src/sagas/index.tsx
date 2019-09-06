import { all } from "redux-saga/effects"
import { watchFetchPage } from "../sagas/PageSagas"
import { fetchWidgetCardsSaga } from './WidgetCardsPaneSagas'

export function* rootSaga() {
  yield all([watchFetchPage(), fetchWidgetCardsSaga()])
}
