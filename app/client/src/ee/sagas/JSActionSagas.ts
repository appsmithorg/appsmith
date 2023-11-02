export * from "ce/sagas/JSActionSagas";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import JSActionAPI from "@appsmith/api/JSActionAPI";
import { validateResponse } from "../../sagas/ErrorSagas";
import type { ApiResponse } from "api/ApiResponses";
import * as log from "loglevel";
import { getIsViewMode } from "selectors/editorSelectors";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
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
} from "ce/sagas/JSActionSagas";
import { all, takeEvery, takeLatest, select } from "redux-saga/effects";

export function* logActionExecutionSaga(
  action: ReduxAction<{
    actionId: string;
    pageId: string;
    collectionId: string;
    actionName: string;
    pageName: string;
  }>,
) {
  try {
    const response: ApiResponse = yield JSActionAPI.logActionExecution({
      metadata: {
        ...action.payload,
        origin: "client",
        viewMode: yield select(getIsViewMode),
      },
      event: "EXECUTE",
      resourceType: "ACTION",
      resourceId: action.payload.actionId,
    });
    yield validateResponse(response);
  } catch (error) {
    log.error(error);
  }
}

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
    takeLatest(ReduxActionTypes.SAVE_JS_COLLECTION_NAME_INIT, saveJSObjectName),
    takeLatest(
      ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_INIT,
      fetchJSCollectionsForPageSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_INIT,
      fetchJSCollectionsForViewModeSaga,
    ),
    takeEvery(
      ReduxActionTypes.AUDIT_LOGS_LOG_ACTION_EXECUTION,
      logActionExecutionSaga,
    ),
  ]);
}
