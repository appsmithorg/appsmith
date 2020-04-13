/* eslint-disable  @typescript-eslint/ban-ts-ignore */
import { put, debounce, takeEvery } from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

let batch: ReduxAction<any>[] = [];
function* storeUpdatesSaga(action: ReduxAction<ReduxAction<any>>) {
  batch.push(action.payload);
  yield put({ type: ReduxActionTypes.EXECUTE_BATCH });
}

function* executeBatchSaga() {
  // @ts-ignore
  yield put(batch);
  batch = [];
}

export default function* root() {
  yield debounce(20, ReduxActionTypes.EXECUTE_BATCH, executeBatchSaga);
  yield takeEvery(ReduxActionTypes.BATCHED_UPDATE, storeUpdatesSaga);
}
