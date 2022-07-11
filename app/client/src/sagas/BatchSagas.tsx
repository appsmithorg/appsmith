/* eslint-disable  @typescript-eslint/ban-ts-comment */
import _ from "lodash";
import { put, debounce, takeEvery, all } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { batchActionSuccess } from "actions/batchActions";
import * as log from "loglevel";

const BATCH_PRIORITY = {
  [ReduxActionTypes.META_UPDATE_DEBOUNCED_EVAL]: {
    priority: 0,
    needsSaga: false,
  },
  [ReduxActionTypes.SET_META_PROP_AND_EVAL]: {
    priority: 0,
    needsSaga: false,
  },
  [ReduxActionTypes.RESET_WIDGET_META]: {
    priority: 0,
    needsSaga: false,
  },
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY]: {
    priority: 0,
    needsSaga: false,
  },
  [ReduxActionTypes.EXECUTE_TRIGGER_REQUEST]: {
    priority: 1,
    needsSaga: true,
  },
  [ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS]: {
    priority: 1,
    needsSaga: true,
  },
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: {
    priority: 0,
    needsSaga: false,
  },
  [ReduxActionTypes.UPDATE_ACTION_INIT]: {
    priority: 1,
    needsSaga: true,
  },
};

const batches: ReduxAction<any>[][] = [];

function* storeUpdatesSaga(action: ReduxAction<ReduxAction<any>>) {
  try {
    const priority = BATCH_PRIORITY[action.payload.type].priority;
    const currentPriorityBatch = batches[priority] || [];
    currentPriorityBatch.push(action.payload);
    _.set(batches, `[${priority}]`, currentPriorityBatch);
    yield put({ type: ReduxActionTypes.EXECUTE_BATCH });
  } catch (e) {
    log.error(`${action.payload.type} action priority not set`);
  }
}

function* executeBatchSaga() {
  for (let priority = 0; priority < batches.length; priority++) {
    const batch = batches[priority];
    if (Array.isArray(batch) && batch.length) {
      const needsSaga = batch.filter((b) => BATCH_PRIORITY[b.type].needsSaga);
      const canBatch = batch.filter((b) => !BATCH_PRIORITY[b.type].needsSaga);
      batches[priority] = [];
      // @ts-expect-error: Types are not available
      yield put(canBatch);
      if (needsSaga.length) {
        for (const sagaAction of needsSaga) {
          yield put(sagaAction);
        }
      }
      yield put(batchActionSuccess(batch));
    }
  }
}

export default function* root() {
  yield all([
    debounce(20, ReduxActionTypes.EXECUTE_BATCH, executeBatchSaga),
    takeEvery(ReduxActionTypes.BATCHED_UPDATE, storeUpdatesSaga),
  ]);
}
