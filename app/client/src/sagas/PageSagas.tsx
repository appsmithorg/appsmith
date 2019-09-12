import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer"
import { ReduxActionTypes, ReduxAction } from "../constants/ReduxActionConstants"
import PageApi, { PageResponse, PageRequest } from "../api/PageApi"
import { call, put, takeEvery } from "redux-saga/effects"
import { RenderModes } from "../constants/WidgetConstants"

export function* fetchPageSaga(pageRequestAction: ReduxAction<PageRequest>) {
  const pageRequest = pageRequestAction.payload
  try {
    const pageResponse: PageResponse = yield call(PageApi.fetchPage, pageRequest)
    if (pageRequest.renderMode === RenderModes.CANVAS) {
      const normalizedResponse = CanvasWidgetsNormalizer.normalize(pageResponse)
      const payload = {
        pageWidgetId: normalizedResponse.result,
        widgets: normalizedResponse.entities.canvasWidgets
      }
      yield put({ type: ReduxActionTypes.UPDATE_CANVAS, payload })
    }
  } catch(err){
    //TODO(abhinav): REFACTOR THIS
  }
}

export function* watchFetchPage() {
  yield takeEvery(ReduxActionTypes.FETCH_PAGE, fetchPageSaga)
}
