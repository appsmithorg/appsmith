import { all } from "redux-saga/effects"
import { canvasSagas } from "../sagas/CanvasSagas"

export function* rootSaga() {
  yield all([canvasSagas()])
}
