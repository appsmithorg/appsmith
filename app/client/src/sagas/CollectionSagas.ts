import { call, takeLatest, put, all } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import ImportedCollectionsApi from "api/CollectionApi";
import { ImportedCollections } from "constants/collectionsConstants";

export function* fetchImportedCollectionsSaga() {
  try {
    const response: ImportedCollections = yield call(
      ImportedCollectionsApi.fetchImportedCollections,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_IMPORTED_COLLECTIONS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_IMPORTED_COLLECTIONS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* importedCollectionsSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_IMPORTED_COLLECTIONS_INIT,
      fetchImportedCollectionsSaga,
    ),
  ]);
}
