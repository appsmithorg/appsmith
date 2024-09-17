export * from "ce/sagas/PageSagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  fetchPageSaga,
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
  setupPageSaga,
  fetchPublishedPageResourcesSaga,
} from "ce/sagas/PageSagas";
import {
  all,
  debounce,
  takeEvery,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import { clearEvalCache } from "sagas/EvaluationsSaga";

export default function* pageSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_PAGE_INIT, fetchPageSaga),
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
      ReduxActionTypes.FETCH_PUBLISHED_PAGE_RESOURCES_INIT,
      fetchPublishedPageResourcesSaga,
    ),
  ]);
}
