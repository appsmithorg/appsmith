import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadCanvasWidgetsPayload,
} from "../constants/ReduxActionConstants";
import PageApi, { PageResponse, PageRequest } from "../api/PageApi";
import { call, put, takeEvery, all } from "redux-saga/effects";
import { RenderModes } from "../constants/WidgetConstants";

export function* fetchPageSaga(pageRequestAction: ReduxAction<PageRequest>) {
  const pageRequest = pageRequestAction.payload;
  try {
    const pageResponse: PageResponse = yield call(
      PageApi.fetchPage,
      pageRequest,
    );
    if (pageRequest.renderMode === RenderModes.CANVAS) {
      const normalizedResponse = CanvasWidgetsNormalizer.normalize(
        pageResponse,
      );
      const canvasWidgetsPayload: LoadCanvasWidgetsPayload = {
        pageWidgetId: normalizedResponse.result,
        widgets: normalizedResponse.entities.canvasWidgets,
      };
      yield all([
        put({ type: ReduxActionTypes.UPDATE_CANVAS, canvasWidgetsPayload }),
        put({
          type: ReduxActionTypes.LOAD_CANVAS_ACTIONS,
          payload: pageResponse.layout.actions,
        }),
      ]);
    }
  } catch (err) {
    //TODO(abhinav): REFACTOR THIS
  }
}

export function* watchFetchPageSaga() {
  yield takeEvery(ReduxActionTypes.FETCH_PAGE, fetchPageSaga);
}
