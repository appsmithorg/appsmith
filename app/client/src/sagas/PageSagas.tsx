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
  fetchPageError,
} from "../actions/pageActions";
import PageApi, {
  FetchPageResponse,
  SavePageResponse,
  FetchPageRequest,
  SavePageRequest,
} from "../api/PageApi";
import { call, put, takeLatest, all } from "redux-saga/effects";
import { extractCurrentDSL } from "./utils";

export function* fetchPage(pageRequestAction: ReduxAction<FetchPageRequest>) {
  const pageRequest = pageRequestAction.payload;
  try {
    const fetchPageResponse: FetchPageResponse = yield call(
      PageApi.fetchPage,
      pageRequest,
    );
    if (fetchPageResponse.responseMeta.success) {
      const normalizedResponse = CanvasWidgetsNormalizer.normalize(
        extractCurrentDSL(fetchPageResponse),
      );
      const canvasWidgetsPayload: LoadCanvasWidgetsPayload = {
        pageWidgetId: normalizedResponse.result,
        widgets: normalizedResponse.entities.canvasWidgets,
        layoutId: fetchPageResponse.data.layouts[0].id,
      };
      yield put(loadCanvasWidgets(canvasWidgetsPayload));
      yield put({
        type: ReduxActionTypes.LOAD_CANVAS_ACTIONS,
        payload: fetchPageResponse.data.layouts[0].actions, // TODO: Refactor
      });
    } else {
      yield put(fetchPageError(fetchPageResponse.responseMeta));
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
