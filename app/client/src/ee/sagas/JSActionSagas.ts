export * from "ce/sagas/JSActionSagas";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import {
  fetchJSCollectionsSaga,
  createJSCollectionSaga,
  copyJSCollectionSaga,
  handleMoveOrCopySaga,
  moveJSCollectionSaga,
  deleteJSCollectionSaga,
  fetchJSCollectionsForPageSaga,
  fetchJSCollectionsForViewModeSaga,
  saveJSObjectName,
  closeJSActionTabSaga,
} from "ce/sagas/JSActionSagas";
import { all, takeEvery, takeLatest } from "redux-saga/effects";

export function* watchJSActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSCollectionsSaga),
    takeEvery(ReduxActionTypes.CREATE_JS_ACTION_INIT, createJSCollectionSaga),
    takeLatest(ReduxActionTypes.COPY_JS_ACTION_INIT, copyJSCollectionSaga),
    takeEvery(ReduxActionTypes.COPY_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.COPY_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.MOVE_JS_ACTION_INIT, moveJSCollectionSaga),
    takeEvery(ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.DELETE_JS_ACTION_INIT, deleteJSCollectionSaga),
    takeLatest(ReduxActionTypes.CLOSE_JS_ACTION_TAB, closeJSActionTabSaga),
    takeLatest(ReduxActionTypes.SAVE_JS_COLLECTION_NAME_INIT, saveJSObjectName),
    takeLatest(
      ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_INIT,
      fetchJSCollectionsForPageSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_INIT,
      fetchJSCollectionsForViewModeSaga,
    ),
  ]);
}
