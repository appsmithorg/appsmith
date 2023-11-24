export * from "ce/sagas/NavigationSagas";

import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { handleRouteChange } from "ce/sagas/NavigationSagas";
import { all, takeEvery } from "redux-saga/effects";

export default function* rootSaga() {
  yield all([
    takeEvery(ReduxActionTypes.ROUTE_CHANGED, handleRouteChange),
    // EE sagas called after this
  ]);
}
