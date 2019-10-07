import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
  UpdateCanvasPayload,
} from "../constants/ReduxActionConstants";
import { updateCanvas, savePageSuccess } from "../actions/pageActions";
import PageApi, {
  FetchPageResponse,
  SavePageResponse,
  FetchPageRequest,
  SavePageRequest,
} from "../api/PageApi";
import { FlattenedWidgetProps } from "../reducers/entityReducers/canvasWidgetsReducer";
import {
  call,
  select,
  put,
  takeLatest,
  takeEvery,
  all,
} from "redux-saga/effects";

import { extractCurrentDSL } from "../utils/WidgetPropsUtils";
import { getEditorConfigs } from "./selectors";
import { validateResponse } from "./ErrorSagas";

export function* fetchPageSaga(
  pageRequestAction: ReduxAction<FetchPageRequest>,
) {
  try {
    const pageRequest = pageRequestAction.payload;
    const fetchPageResponse: FetchPageResponse = yield call(
      PageApi.fetchPage,
      pageRequest,
    );
    const isValidResponse = yield validateResponse(fetchPageResponse);
    if (isValidResponse) {
      const normalizedResponse = CanvasWidgetsNormalizer.normalize(
        extractCurrentDSL(fetchPageResponse),
      );
      const canvasWidgetsPayload: UpdateCanvasPayload = {
        pageWidgetId: normalizedResponse.result,
        currentPageName: fetchPageResponse.data.name,
        currentPageId: fetchPageResponse.data.id,
        widgets: normalizedResponse.entities.canvasWidgets,
        currentLayoutId: fetchPageResponse.data.layouts[0].id, // TODO(abhinav): Handle for multiple layouts
      };
      yield all([
        put(updateCanvas(canvasWidgetsPayload)),
        put({
          type: ReduxActionTypes.LOAD_CANVAS_ACTIONS,
          payload: fetchPageResponse.data.actions,
        }),
      ]);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* savePageSaga(savePageAction: ReduxAction<SavePageRequest>) {
  const savePageRequest = savePageAction.payload;
  savePageRequest.pageId = "123443";
  try {
    const savePageResponse: SavePageResponse = yield call(
      PageApi.savePage,
      savePageRequest,
    );
    const isValidResponse = validateResponse(savePageResponse);
    if (isValidResponse) {
      yield put(savePageSuccess(savePageResponse));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* saveLayoutSaga(
  updateLayoutAction: ReduxAction<{
    widgets: { [widgetId: string]: FlattenedWidgetProps };
  }>,
) {
  try {
    const { widgets } = updateLayoutAction.payload;
    const denormalizedDSL = CanvasWidgetsNormalizer.denormalize(
      Object.keys(widgets)[0],
      { canvasWidgets: widgets },
    );
    const editorConfigs = yield select(getEditorConfigs) as any;
    yield put({
      type: ReduxActionTypes.SAVE_PAGE_INIT,
      payload: {
        ...editorConfigs,
        dsl: denormalizedDSL,
      },
    });
  } catch (err) {
    console.log(err);
  }
}

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE, fetchPageSaga),
    takeLatest(ReduxActionTypes.SAVE_PAGE_INIT, savePageSaga),
    takeEvery(ReduxActionTypes.UPDATE_LAYOUT, saveLayoutSaga),
  ]);
}
