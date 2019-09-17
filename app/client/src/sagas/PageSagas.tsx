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
    // const pageResponse: PageResponse = yield call(
    //   PageApi.fetchPage,
    //   pageRequest,
    // );
    if (pageRequest.renderMode === RenderModes.CANVAS) {
      const pageResponse = JSON.parse(`{
        "responseMeta": {},
        "layout": {
          "dsl": {
            "widgetId": "0",
            "type": "CONTAINER_WIDGET",
            "snapColumns": 1000,
            "snapRows": 1500,
            "topRow": 0,
            "bottomRow": 2,
            "leftColumn": 0,
            "rightColumn": 2,
            "parentColumnSpace": 1,
            "parentRowSpace": 1,
            "backgroundColor": "#ffffff",
            "renderMode": "CANVAS",
            "children": [
              {
                "widgetId": "1",
                "type": "CONTAINER_WIDGET",
                "snapColumns": 10,
                "snapRows": 10,
                "topRow": 1,
                "bottomRow": 2,
                "leftColumn": 1,
                "rightColumn": 2,
                "backgroundColor": "#000000",
                "renderMode": "CANVAS",
                "children": []
              }
            ]
          }
        }
      }`);
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

export function* watchFetchPage() {
  yield takeEvery(ReduxActionTypes.FETCH_PAGE, fetchPageSaga);
}
