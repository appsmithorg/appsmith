import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer"
import { ActionTypes, ReduxAction } from "../constants/ActionConstants"
import PageApi, { PageResponse, PageRequest } from "../api/PageApi"
import { call, put, takeLeading, all, takeEvery } from "redux-saga/effects"
import { RenderModes } from "../constants/WidgetConstants"

export function* fetchPageSaga(pageRequestAction: ReduxAction<PageRequest>) {
  const pageRequest = pageRequestAction.payload
  const pageResponse: PageResponse = yield call(PageApi.fetchPage, pageRequest)
  if (pageRequest.renderMode === RenderModes.CANVAS) {
    const normalizedResponse = CanvasWidgetsNormalizer.normalize(pageResponse)
    const payload = {
      pageWidgetId: normalizedResponse.result,
      widgets: normalizedResponse.entities.canvasWidgets
    }
    yield put({ type: ActionTypes.UPDATE_CANVAS, payload })
  }
}

export function* watchFetchPage() {
  yield takeEvery(ActionTypes.FETCH_PAGE, fetchPageSaga)
}
