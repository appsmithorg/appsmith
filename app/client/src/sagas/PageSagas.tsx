import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
  UpdateCanvasPayload,
  LayoutPayload,
} from "../constants/ReduxActionConstants";
import { updateCanvas, savePageSuccess } from "../actions/pageActions";
import PageApi, {
  FetchPageResponse,
  SavePageResponse,
  FetchPageRequest,
  SavePageRequest,
  FetchPublishedPageRequest,
  FetchPublishedPageResponse,
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
import { getEditorConfigs, getWidgets } from "./selectors";
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
        currentApplicationId: fetchPageResponse.data.applicationId,
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

export function* fetchPublishedPageSaga(
  pageRequestAction: ReduxAction<FetchPublishedPageRequest>,
) {
  try {
    const request: FetchPublishedPageRequest = pageRequestAction.payload;
    const response: FetchPublishedPageResponse = yield call(
      PageApi.fetchPublishedPage,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const normalizedResponse = CanvasWidgetsNormalizer.normalize(
        response.data.dsl,
      );
      const layoutPayload: LayoutPayload = {
        widgets: normalizedResponse,
        layoutId: response.data.id,
        pageId: request.pageId,
      };

      yield put({
        type: ReduxActionTypes.FETCH_PUBLISED_PAGE_SUCCESS,
        payload: layoutPayload,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PUBLISHED_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* savePageSaga(savePageAction: ReduxAction<SavePageRequest>) {
  const savePageRequest = savePageAction.payload;
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

function getLayoutSavePayload(
  widgets: {
    [widgetId: string]: FlattenedWidgetProps;
  },
  editorConfigs: any,
) {
  const denormalizedDSL = CanvasWidgetsNormalizer.denormalize(
    Object.keys(widgets)[0],
    { canvasWidgets: widgets },
  );
  return {
    ...editorConfigs,
    dsl: denormalizedDSL,
  };
}

export function* saveLayoutSaga(
  updateLayoutAction: ReduxAction<{
    widgets: { [widgetId: string]: FlattenedWidgetProps };
  }>,
) {
  try {
    const { widgets } = updateLayoutAction.payload;
    const editorConfigs = yield select(getEditorConfigs) as any;

    yield put({
      type: ReduxActionTypes.SAVE_PAGE_INIT,
      payload: getLayoutSavePayload(widgets, editorConfigs),
    });
  } catch (err) {
    console.log(err);
  }
}

// TODO(abhinav): This has redundant code. The only thing different here is the lack of state update.
// For now this is fire and forget.
export function* asyncSaveLayout() {
  try {
    const widgets = yield select(getWidgets);
    const editorConfigs = yield select(getEditorConfigs) as any;

    const request: SavePageRequest = getLayoutSavePayload(
      widgets,
      editorConfigs,
    );

    const savePageResponse: SavePageResponse = yield call(
      PageApi.savePage,
      request,
    );
    if (!validateResponse(savePageResponse)) {
      throw Error("Error when saving layout");
    }
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.UPDATE_WIDGET_PROPERTY_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE, fetchPageSaga),
    takeLatest(
      ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      fetchPublishedPageSaga,
    ),
    takeLatest(ReduxActionTypes.SAVE_PAGE_INIT, savePageSaga),
    takeEvery(ReduxActionTypes.UPDATE_LAYOUT, saveLayoutSaga),
    // No need to save layout everytime a property is updated.
    // We save the latest request to update layout.
    takeLatest(ReduxActionTypes.UPDATE_WIDGET_PROPERTY, asyncSaveLayout),
  ]);
}
