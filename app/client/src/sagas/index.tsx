import { all } from "redux-saga/effects"
import { watchFetchCanvas } from "../sagas/CanvasSagas"

export function* rootSaga() {
  yield all([watchFetchCanvas()])
}
