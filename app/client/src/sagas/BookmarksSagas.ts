/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { all, put, select, takeEvery } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { Bookmark, BookmarksMap } from "api/BookmarksAPI";
import BookmarksApi from "api/BookmarksAPI";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import { getBookmarks } from "selectors/entitiesSelector";

function* fetchBookmarksSaga(action: ReduxAction<{ applicationId: string }>) {
  try {
    // let applicationId: string = yield select(getCurrentApplicationId);

    const response: ApiResponse<BookmarksMap> =
      yield BookmarksApi.fetchBookmarks(action.payload.applicationId);
    yield put({
      type: ReduxActionTypes.FETCH_BOOKMARK_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_BOOKMARK_FAILURE,
      payload: { error },
    });
  }
}

function* createBookmartSaga(action: ReduxAction<{ bookmark: Bookmark }>) {
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    const pageId: string = yield select(getCurrentPageId);
    const bookmarks: BookmarksMap = yield select(getBookmarks);

    const newBookmarks = { ...bookmarks };

    if (!newBookmarks[pageId]) {
      newBookmarks[pageId] = [];
    }

    newBookmarks[pageId].push(action.payload.bookmark);

    // Remove this once server side changes are available
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));

    const response: ApiResponse<BookmarksMap> =
      yield BookmarksApi.createBookmark(applicationId, newBookmarks);
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_BOOKMARK_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_BOOKMARK_FAILURE,
      payload: { error },
    });
  }
}

export function* watchBookmarksSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_BOOKMARKS, fetchBookmarksSaga),
    takeEvery(ReduxActionTypes.CREATE_BOOKMARK, createBookmartSaga),
  ]);
}
