export * from "ce/sagas/PageSagas";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getFeatureFlagsForEngine,
  type DependentFeatureFlags,
} from "@appsmith/selectors/engineSelectors";
import type { FetchPageRequest } from "api/PageApi";
import {
  fetchPageSaga,
  fetchPublishedPageSaga,
  saveLayoutSaga,
  createPageSaga,
  createNewPageFromEntity,
  clonePageSaga,
  updatePageSaga,
  deletePageSaga,
  savePageSaga,
  updateWidgetNameSaga,
  fetchAllPublishedPagesSaga,
  generateTemplatePageSaga,
  setPageOrderSaga,
  populatePageDSLsSaga,
  setCanvasCardsStateSaga,
  deleteCanvasCardsStateSaga,
  setPreviewModeInitSaga,
  refreshTheApp,
} from "ce/sagas/PageSagas";
import {
  all,
  call,
  debounce,
  put,
  select,
  takeEvery,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import { clearEvalCache } from "sagas/EvaluationsSaga";
import {
  setupModuleInstanceForViewSaga,
  setupModuleInstanceSaga,
} from "./moduleInstanceSagas";

export function* setupPageSaga(action: ReduxAction<FetchPageRequest>) {
  try {
    const { id, isFirstLoad } = action.payload;
    const featureFlags: DependentFeatureFlags = yield select(
      getFeatureFlagsForEngine,
    );

    if (featureFlags.showQueryModule) {
      yield call(setupModuleInstanceSaga, {
        type: ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
        payload: {
          contextId: id,
          contextType: ModuleInstanceCreatorType.PAGE,
          viewMode: false,
        },
      });
    }

    yield call(fetchPageSaga, {
      type: ReduxActionTypes.FETCH_PAGE_INIT,
      payload: { id, isFirstLoad },
    });

    yield put({
      type: ReduxActionTypes.SETUP_PAGE_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* setupPublishedPageSaga(
  action: ReduxAction<{
    pageId: string;
    bustCache: boolean;
    firstLoad: boolean;
  }>,
) {
  try {
    const { bustCache, firstLoad, pageId } = action.payload;
    const featureFlags: DependentFeatureFlags = yield select(
      getFeatureFlagsForEngine,
    );

    if (featureFlags.showQueryModule) {
      yield call(setupModuleInstanceForViewSaga, {
        type: ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_INIT,
        payload: {
          contextId: pageId,
          contextType: ModuleInstanceCreatorType.PAGE,
          viewMode: true,
        },
      });
    }
    yield call(fetchPublishedPageSaga, {
      type: ReduxActionTypes.FETCH_PUBLISHED_PAGE_INIT,
      payload: { bustCache, firstLoad, pageId },
    });

    yield put({
      type: ReduxActionTypes.SETUP_PUBLISHED_PAGE_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_PUBLISHED_PAGE_ERROR,
      payload: { error },
    });
  }
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
    takeLeading(
      ReduxActionTypes.CREATE_NEW_PAGE_FROM_ENTITIES,
      createNewPageFromEntity,
    ),
    takeLeading(ReduxActionTypes.CLONE_PAGE_INIT, clonePageSaga),
    takeLatest(ReduxActionTypes.UPDATE_PAGE_INIT, updatePageSaga),
    takeLatest(ReduxActionTypes.DELETE_PAGE_INIT, deletePageSaga),
    debounce(500, ReduxActionTypes.SAVE_PAGE_INIT, savePageSaga),
    takeLatest(ReduxActionTypes.UPDATE_WIDGET_NAME_INIT, updateWidgetNameSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      fetchAllPublishedPagesSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_TEMPLATE_PAGE_INIT,
      generateTemplatePageSaga,
    ),
    takeLatest(ReduxActionTypes.SET_PAGE_ORDER_INIT, setPageOrderSaga),
    takeLatest(ReduxActionTypes.POPULATE_PAGEDSLS_INIT, populatePageDSLsSaga),
    takeEvery(ReduxActionTypes.SET_CANVAS_CARDS_STATE, setCanvasCardsStateSaga),
    takeEvery(
      ReduxActionTypes.DELETE_CANVAS_CARDS_STATE,
      deleteCanvasCardsStateSaga,
    ),
    takeEvery(ReduxActionTypes.SET_PREVIEW_MODE_INIT, setPreviewModeInitSaga),
    takeLatest(ReduxActionTypes.REFRESH_THE_APP, refreshTheApp),
    takeLatest(ReduxActionTypes.CLEAR_CACHE, clearEvalCache),
    takeLatest(ReduxActionTypes.SETUP_PAGE_INIT, setupPageSaga),
    takeLatest(
      ReduxActionTypes.SETUP_PUBLISHED_PAGE_INIT,
      setupPublishedPageSaga,
    ),
  ]);
}
