import CanvasWidgetsNormalizer, {
} from "../normalizers/CanvasWidgetsNormalizer"
import {
  ActionTypes,
} from "../constants/ActionConstants"
import PageApi, { PageResponse } from "../api/PageApi"
import { call, put, takeLeading, all, takeEvery } from "redux-saga/effects"

export function* fetchCanvas() {
  const pageResponse: PageResponse = yield call(PageApi.fetchPage, {
    pageId: "123"
  })
  const normalizedResponse = CanvasWidgetsNormalizer.normalize(pageResponse)
  const payload = {
    pageWidgetId: normalizedResponse.result,
    widgets: normalizedResponse.entities.canvasWidgets
  }
  yield put({ type: ActionTypes.UPDATE_CANVAS, payload })
}

export function* watchFetchCanvas() {
  yield takeEvery(ActionTypes.FETCH_CANVAS, fetchCanvas)
}

export function* canvasSagas() {
  yield all([fetchCanvas(), watchFetchCanvas()])
}
