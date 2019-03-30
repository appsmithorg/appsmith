import { all } from "redux-saga/effects"
import { watchFetchPage } from "../sagas/PageSagas"

export function* rootSaga() {
  yield all([watchFetchPage()])
}
