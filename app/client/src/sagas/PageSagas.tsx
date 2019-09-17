import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadCanvasWidgetsPayload,
} from "../constants/ReduxActionConstants";
import {
  loadCanvasWidgets,
  savePageError,
  savePageSuccess,
} from "../actions/pageActions";
import PageApi, {
  FetchPageResponse,
  SavePageResponse,
  FetchPageRequest,
  SavePageRequest,
} from "../api/PageApi";
import { call, put, takeLatest, all } from "redux-saga/effects";
import { RenderModes } from "../constants/WidgetConstants";

export function* fetchPage(pageRequestAction: ReduxAction<FetchPageRequest>) {
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
            "snapColumns": 16,
            "snapRows": 100,
            "topRow": 0,
            "bottomRow": 2000,
            "leftColumn": 0,
            "rightColumn": 1000,
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
                "bottomRow": 20,
                "leftColumn": 1,
                "rightColumn": 16,
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

      yield put(loadCanvasWidgets(canvasWidgetsPayload));
      yield put({
        type: ReduxActionTypes.LOAD_CANVAS_ACTIONS,
        payload: pageResponse.layout.actions,
      });
    }
  } catch (err) {
    console.log(err);
    //TODO(abhinav): REFACTOR THIS
  }
}

export function* savePage(savePageAction: ReduxAction<SavePageRequest>) {
  const savePageRequest = savePageAction.payload;

  try {
    const savePageResponse: SavePageResponse = yield call(
      PageApi.savePage,
      savePageRequest,
    );
    yield put(savePageSuccess(savePageResponse));
  } catch (err) {
    console.log(err);
    yield put(savePageError(err));
  }
}

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE, fetchPage),
    takeLatest(ReduxActionTypes.SAVE_PAGE_INIT, savePage),
  ]);
}
