export * from "ce/sagas/NavigationSagas";

import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { all, takeEvery } from "redux-saga/effects";
import { handlePageChange, handleRouteChange } from "ce/sagas/NavigationSagas";

export default function* rootSaga() {
  yield all([
    takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange),
    takeEvery(ReduxActionTypes.PAGE_CHANGED, handlePageChange),
    // EE sagas called after this
  ]);
}
