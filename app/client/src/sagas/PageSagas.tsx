import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { AppState } from "reducers";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
  UpdateCanvasPayload,
  PageListPayload,
  FetchPageListPayload,
} from "constants/ReduxActionConstants";
import {
  updateCanvas,
  savePageSuccess,
  fetchPageSuccess,
  updateWidgetNameSuccess,
  deletePageSuccess,
  updateCurrentPage,
  fetchPublishedPageSuccess,
  setUrlData,
} from "actions/pageActions";
import PageApi, {
  FetchPageResponse,
  SavePageResponse,
  FetchPageRequest,
  FetchPublishedPageRequest,
  FetchPublishedPageResponse,
  CreatePageRequest,
  FetchPageListResponse,
  UpdatePageRequest,
  DeletePageRequest,
  UpdateWidgetNameRequest,
  UpdateWidgetNameResponse,
  PageLayout,
} from "api/PageApi";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  call,
  select,
  put,
  takeLatest,
  all,
  debounce,
  takeLeading,
} from "redux-saga/effects";
import history from "utils/history";
import { BUILDER_PAGE_URL } from "constants/routes";

import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { getEditorConfigs, getWidgets, getAllPageIds } from "./selectors";
import { validateResponse } from "./ErrorSagas";
import { executePageLoadActions } from "actions/widgetActions";
import { ApiResponse } from "api/ApiResponses";
import {
  getCurrentPageId,
  getCurrentLayoutId,
  getCurrentApplicationId,
  getCurrentPageName,
} from "selectors/editorSelectors";
import { fetchActionsForPage } from "actions/actionActions";
import {
  getExistingWidgetNames,
  getExistingPageNames,
  getExistingActionNames,
} from "./selectors";
import { clearCaches } from "utils/DynamicBindingUtils";
import { UrlDataState } from "@appsmith/reducers/entityReducers/urlReducer";

const getWidgetName = (state: AppState, widgetId: string) =>
  state.entities.canvasWidgets[widgetId];

export function* fetchPageListSaga(
  fetchPageListAction: ReduxAction<FetchPageListPayload>,
) {
  try {
    const { applicationId } = fetchPageListAction.payload;
    const response: FetchPageListResponse = yield call(
      PageApi.fetchPageList,
      applicationId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const orgId = response.data.organizationId;
      const pages: PageListPayload = response.data.pages.map(page => ({
        pageName: page.name,
        pageId: page.id,
        isDefault: page.isDefault,
      }));
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
        payload: {
          pages,
          applicationId,
        },
      });
      yield put({
        type: ReduxActionTypes.SET_CURRENT_ORG_ID,
        payload: {
          orgId,
        },
      });

      return;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_LIST_ERROR,
      payload: {
        error,
      },
    });
  }
}

const getCanvasWidgetsPayload = (
  pageResponse: FetchPageResponse,
): UpdateCanvasPayload => {
  const normalizedResponse = CanvasWidgetsNormalizer.normalize(
    extractCurrentDSL(pageResponse),
  );
  return {
    pageWidgetId: normalizedResponse.result,
    currentPageName: pageResponse.data.name,
    currentPageId: pageResponse.data.id,
    widgets: normalizedResponse.entities.canvasWidgets,
    currentLayoutId: pageResponse.data.layouts[0].id, // TODO(abhinav): Handle for multiple layouts
    currentApplicationId: pageResponse.data.applicationId,
    pageActions: pageResponse.data.layouts[0].layoutOnLoadActions || [],
  };
};

export function* fetchPageSaga(
  pageRequestAction: ReduxAction<FetchPageRequest>,
) {
  try {
    const { id } = pageRequestAction.payload;
    const fetchPageResponse: FetchPageResponse = yield call(PageApi.fetchPage, {
      id,
    });
    const isValidResponse = yield validateResponse(fetchPageResponse);
    if (isValidResponse) {
      // Clear any existing caches
      clearCaches();
      // Set url params
      yield call(setDataUrl);
      // Get Canvas payload
      const canvasWidgetsPayload = getCanvasWidgetsPayload(fetchPageResponse);
      // Update the canvas
      yield put(updateCanvas(canvasWidgetsPayload));
      // set current page
      yield put(updateCurrentPage(id));
      // dispatch fetch page success
      yield put(fetchPageSuccess());
      // Execute page load actions
      yield put(executePageLoadActions(canvasWidgetsPayload.pageActions));
    }
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchPublishedPageSaga(
  pageRequestAction: ReduxAction<{ pageId: string; bustCache: boolean }>,
) {
  try {
    const { pageId, bustCache } = pageRequestAction.payload;
    const request: FetchPublishedPageRequest = {
      pageId,
      bustCache,
    };
    const response: FetchPublishedPageResponse = yield call(
      PageApi.fetchPublishedPage,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      // Clear any existing caches
      clearCaches();
      // Set url params
      yield call(setDataUrl);
      // Get Canvas payload
      const canvasWidgetsPayload = getCanvasWidgetsPayload(response);
      // Update the canvas
      yield put(updateCanvas(canvasWidgetsPayload));
      // set current page
      yield put(updateCurrentPage(pageId));
      // dispatch fetch page success
      yield put(
        fetchPublishedPageSuccess({
          dsl: response.data.layouts[0].dsl,
          pageId: request.pageId,
          pageWidgetId: canvasWidgetsPayload.pageWidgetId,
        }),
      );
      // Execute page load actions
      yield put(executePageLoadActions(canvasWidgetsPayload.pageActions));
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

export function* fetchAllPublishedPagesSaga() {
  try {
    const pageIds = yield select(getAllPageIds);
    yield all(
      pageIds.map((pageId: string) => {
        return call(PageApi.fetchPublishedPage, { pageId });
      }),
    );
  } catch (error) {
    console.log({ error });
  }
}

function* savePageSaga() {
  const widgets = yield select(getWidgets);
  const editorConfigs = yield select(getEditorConfigs) as any;
  const savePageRequest = getLayoutSavePayload(widgets, editorConfigs);
  try {
    // Store the updated DSL in the pageDSLs reducer
    yield put({
      type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
      payload: {
        pageId: savePageRequest.pageId,
        dsl: savePageRequest.dsl,
      },
    });
    const savePageResponse: SavePageResponse = yield call(
      PageApi.savePage,
      savePageRequest,
    );
    const isValidResponse = yield validateResponse(savePageResponse);
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

export function* saveLayoutSaga() {
  try {
    yield put({
      type: ReduxActionTypes.SAVE_PAGE_INIT,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createPageSaga(
  createPageAction: ReduxAction<CreatePageRequest>,
) {
  try {
    const request: CreatePageRequest = createPageAction.payload;
    const response: FetchPageResponse = yield call(PageApi.createPage, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_PAGE_SUCCESS,
        payload: {
          pageId: response.data.id,
          pageName: response.data.name,
          layoutId: response.data.layouts[0].id,
        },
      });
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_DSL_INIT,
        payload: {
          pageId: response.data.id,
        },
      });
      history.push(
        BUILDER_PAGE_URL(
          createPageAction.payload.applicationId,
          response.data.id,
        ),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updatePageSaga(action: ReduxAction<UpdatePageRequest>) {
  try {
    const request: UpdatePageRequest = action.payload;
    const response: ApiResponse = yield call(PageApi.updatePage, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_PAGE_SUCCESS,
        payload: action.payload,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_PAGE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deletePageSaga(action: ReduxAction<DeletePageRequest>) {
  try {
    const request: DeletePageRequest = action.payload;
    const defaultPageId = yield select(
      (state: AppState) => state.entities.pageList.defaultPageId,
    );
    const applicationId = yield select(
      (state: AppState) => state.entities.pageList.applicationId,
    );
    if (defaultPageId === request.id) {
      throw Error("Cannot delete the home page.");
    } else {
      const response: ApiResponse = yield call(PageApi.deletePage, request);
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        yield put(deletePageSuccess());
      }
      const currentPageId = yield select(
        (state: AppState) => state.entities.pageList.currentPageId,
      );
      if (currentPageId === action.payload.id)
        history.push(BUILDER_PAGE_URL(applicationId, defaultPageId));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_PAGE_ERROR,
      payload: {
        error: { message: error.message, show: true },
        show: true,
      },
    });
  }
}

export function* updateWidgetNameSaga(
  action: ReduxAction<{ id: string; newName: string }>,
) {
  try {
    const { widgetName } = yield select(getWidgetName, action.payload.id);
    const layoutId = yield select(getCurrentLayoutId);
    const pageId = yield select(getCurrentPageId);
    const existingWidgetNames = yield select(getExistingWidgetNames);
    const existingActionNames = yield select(getExistingActionNames);
    const existingPageNames = yield select(getExistingPageNames);
    const hasWidgetNameConflict =
      existingWidgetNames.indexOf(action.payload.newName) > -1 ||
      existingActionNames.indexOf(action.payload.newName) > -1 ||
      existingPageNames.indexOf(action.payload.newName) > -1;
    if (!hasWidgetNameConflict) {
      const request: UpdateWidgetNameRequest = {
        newName: action.payload.newName,
        oldName: widgetName,
        pageId,
        layoutId,
      };
      const response: UpdateWidgetNameResponse = yield call(
        PageApi.updateWidgetName,
        request,
      );
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        yield updateCanvasWithDSL(response.data, pageId, layoutId);

        yield put(updateWidgetNameSuccess());
      }
    } else {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR,
        payload: {
          error: {
            message: `Entity name: ${action.payload.newName} is already being used.`,
          },
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updateCanvasWithDSL(
  data: PageLayout,
  pageId: string,
  layoutId: string,
) {
  const normalizedWidgets = CanvasWidgetsNormalizer.normalize(data.dsl);
  const currentPageName = yield select(getCurrentPageName);
  const applicationId = yield select(getCurrentApplicationId);
  const canvasWidgetsPayload: UpdateCanvasPayload = {
    pageWidgetId: normalizedWidgets.result,
    currentPageName,
    currentPageId: pageId,
    currentLayoutId: layoutId,
    currentApplicationId: applicationId,
    pageActions: data.layoutOnLoadActions,
    widgets: normalizedWidgets.entities.canvasWidgets,
  };
  yield put(updateCanvas(canvasWidgetsPayload));
  yield put(fetchActionsForPage(pageId));
}

function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const keys = urlParams.keys();
  let key = keys.next().value;
  const queryParams: Record<string, string> = {};
  while (key) {
    queryParams[key] = urlParams.get(key) as string;
    key = keys.next().value;
  }
  return queryParams;
}

export function* setDataUrl() {
  const urlData: UrlDataState = {
    host: window.location.host,
    hostname: window.location.hostname,
    queryParams: getQueryParams(),
    protocol: window.location.protocol,
    pathname: window.location.pathname,
    port: window.location.port,
    href: window.location.href,
    hash: window.location.hash,
  };
  yield put(setUrlData(urlData));
}

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE_INIT, fetchPageSaga),
    takeLatest(
      ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      fetchPublishedPageSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_LAYOUT, saveLayoutSaga),
    takeLeading(ReduxActionTypes.CREATE_PAGE_INIT, createPageSaga),
    takeLatest(ReduxActionTypes.FETCH_PAGE_LIST_INIT, fetchPageListSaga),
    takeLatest(ReduxActionTypes.UPDATE_PAGE_INIT, updatePageSaga),
    takeLatest(ReduxActionTypes.DELETE_PAGE_INIT, deletePageSaga),
    debounce(500, ReduxActionTypes.SAVE_PAGE_INIT, savePageSaga),
    takeLatest(ReduxActionTypes.UPDATE_WIDGET_NAME_INIT, updateWidgetNameSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      fetchAllPublishedPagesSaga,
    ),
  ]);
}
